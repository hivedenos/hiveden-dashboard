"use client";

import { connectToSession } from "@/lib/shellClient";
import { ActionIcon, Badge, Box, Card, Group, Text } from "@mantine/core";
import { IconTrash, IconX } from "@tabler/icons-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { FitAddon } from "@xterm/addon-fit";
import type { Terminal as XTerm } from "xterm";
import "xterm/css/xterm.css";

type TerminalMode = "interactive" | "stream";
type ConnectionState = "connecting" | "connected" | "disconnected" | "error" | "completed";
type WsMessage = {
  type?: string;
  message?: string;
  data?: {
    output?: string;
    exit_code?: number;
    status?: string;
  };
};

interface TerminalProps {
  sessionId?: string;
  socketFactory?: () => WebSocket;
  onClose?: () => void;
  title?: string;
  mode?: TerminalMode;
  height?: number | string;
  showStatusBar?: boolean;
  readOnly?: boolean;
}

export const Terminal: React.FC<TerminalProps> = ({
  sessionId,
  socketFactory,
  onClose,
  title = "Terminal",
  mode,
  height = "100%",
  showStatusBar = true,
  readOnly,
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");

  const effectiveMode = useMemo<TerminalMode>(() => {
    if (mode) return mode;
    if (sessionId) return "interactive";
    return "stream";
  }, [mode, sessionId]);

  const isReadOnly = readOnly ?? effectiveMode === "stream";
  const heightStyle = typeof height === "number" ? `${height}px` : height;
  const normalizeLineEndings = (value: string) => value.replace(/\r?\n/g, "\r\n");

  useEffect(() => {
    if (!terminalRef.current) return;
    if (!sessionId && !socketFactory) return;

    let disposed = false;
    let dataDisposable: { dispose: () => void } | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let removeWindowResize: (() => void) | null = null;

    setConnectionState("connecting");

    const initTerminal = async () => {
      const [{ Terminal: XTermConstructor }, { FitAddon: FitAddonConstructor }, { WebLinksAddon: WebLinksAddonConstructor }] = await Promise.all([
        import("xterm"),
        import("@xterm/addon-fit"),
        import("@xterm/addon-web-links"),
      ]);
      if (disposed || !terminalRef.current) return;

      const term = new XTermConstructor({
        cursorBlink: true,
        cursorStyle: "block",
        fontSize: 14,
        lineHeight: 1.3,
        letterSpacing: 0.2,
        fontFamily: '"JetBrains Mono", "Fira Code", Menlo, Monaco, Consolas, "Courier New", monospace',
        scrollback: 6000,
        convertEol: effectiveMode === "stream",
        disableStdin: isReadOnly,
        theme: {
          background: "#0f1117",
          foreground: "#e6edf3",
          cursor: "#8b949e",
          selectionBackground: "#264f78",
          black: "#0f1117",
          red: "#ff7b72",
          green: "#3fb950",
          yellow: "#d29922",
          blue: "#58a6ff",
          magenta: "#bc8cff",
          cyan: "#39c5cf",
          white: "#b1bac4",
          brightBlack: "#6e7681",
          brightRed: "#ffa198",
          brightGreen: "#56d364",
          brightYellow: "#e3b341",
          brightBlue: "#79c0ff",
          brightMagenta: "#d2a8ff",
          brightCyan: "#56d4dd",
          brightWhite: "#f0f6fc",
        },
      });

      const fitAddon = new FitAddonConstructor();
      const webLinksAddon = new WebLinksAddonConstructor();
      term.loadAddon(fitAddon);
      term.loadAddon(webLinksAddon);
      term.open(terminalRef.current);
      term.focus();

      xtermRef.current = term;
      fitAddonRef.current = fitAddon;

      const ws = socketFactory ? socketFactory() : connectToSession(sessionId!);
      wsRef.current = ws;

      const sendResize = () => {
        if (!xtermRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(
          JSON.stringify({
            type: "resize",
            cols: xtermRef.current.cols,
            rows: xtermRef.current.rows,
          }),
        );
      };

      const fitAndResize = () => {
        try {
          fitAddon.fit();
          sendResize();
        } catch {
          // Ignore intermittent fitting failures during layout transitions.
        }
      };

      fitAndResize();

      const handleWindowResize = () => fitAndResize();
      window.addEventListener("resize", handleWindowResize);
      removeWindowResize = () => window.removeEventListener("resize", handleWindowResize);

      if (typeof ResizeObserver !== "undefined" && terminalRef.current) {
        resizeObserver = new ResizeObserver(() => fitAndResize());
        resizeObserver.observe(terminalRef.current);
      }

      ws.onopen = () => {
        if (disposed) return;
        setConnectionState("connected");
        fitAndResize();
      };

      ws.onmessage = async (event) => {
        if (disposed || !xtermRef.current) return;

        let payload: string | null = null;
        const rawData = event.data;

        if (typeof rawData === "string") {
          payload = rawData;
        } else if (rawData instanceof Blob) {
          payload = await rawData.text();
        } else if (rawData instanceof ArrayBuffer) {
          payload = new TextDecoder().decode(rawData);
        }

        if (!payload) return;

        let message: WsMessage | null = null;
        try {
          message = JSON.parse(payload) as WsMessage;
        } catch {
          xtermRef.current.write(normalizeLineEndings(payload));
          return;
        }

        if (message.type === "output" || message.type === "log") {
          const outputText = typeof message.data?.output === "string" ? message.data.output : "";
          if (outputText) {
            xtermRef.current.write(normalizeLineEndings(outputText));
          }
          return;
        }

        if (message.type === "error") {
          const errorText = message.message ? `Error: ${message.message}` : "Error";
          xtermRef.current.writeln(`\x1b[1;31m${errorText}\x1b[0m`);
          setConnectionState("error");
          return;
        }

        if (message.type === "exit") {
          xtermRef.current.writeln(`\r\n\x1b[1;33mSession ended (exit: ${message.data?.exit_code ?? "unknown"})\x1b[0m`);
          setConnectionState("disconnected");
          return;
        }

        if (message.type === "job_completed") {
          const status = message.data?.status || "completed";
          const exitCode = message.data?.exit_code ?? "unknown";
          const color = status === "completed" ? "\x1b[1;32m" : "\x1b[1;31m";
          xtermRef.current.writeln(`\r\n${color}Job ${status} (Exit Code: ${exitCode})\x1b[0m`);
          setConnectionState("completed");
          if (effectiveMode === "stream") {
            ws.close();
          }
        }
      };

      ws.onclose = () => {
        if (disposed) return;
        setConnectionState((prev) => (prev === "completed" ? "completed" : "disconnected"));
      };

      ws.onerror = () => {
        if (disposed) return;
        setConnectionState("error");
      };

      if (!isReadOnly) {
        dataDisposable = term.onData((data) => {
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
          // Some shell backends expect Ctrl+H (\b) instead of DEL (\x7f) for backspace.
          // Normalize this so Backspace works reliably in interactive mode.
          const normalizedInput = data === "\x7f" ? "\b" : data;
          wsRef.current.send(
            JSON.stringify({
              type: "input",
              data: normalizedInput,
            }),
          );
        });
      }
    };

    initTerminal();

    return () => {
      disposed = true;
      if (removeWindowResize) removeWindowResize();
      if (resizeObserver) resizeObserver.disconnect();
      if (dataDisposable) dataDisposable.dispose();
      if (wsRef.current) wsRef.current.close();
      if (xtermRef.current) xtermRef.current.dispose();
      wsRef.current = null;
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, [sessionId, socketFactory, effectiveMode, isReadOnly]);

  const statusColor: Record<ConnectionState, string> = {
    connecting: "yellow",
    connected: "green",
    disconnected: "gray",
    error: "red",
    completed: "teal",
  };

  const statusLabel: Record<ConnectionState, string> = {
    connecting: "Connecting",
    connected: "Connected",
    disconnected: "Disconnected",
    error: "Error",
    completed: "Completed",
  };

  return (
    <Card shadow="sm" padding="0" radius="md" withBorder style={{ height: heightStyle, display: "flex", flexDirection: "column" }}>
      {showStatusBar && (
        <Box
          p="xs"
          style={{
            borderBottom: "1px solid var(--mantine-color-default-border)",
            background: "linear-gradient(180deg, #1b2028 0%, #151a21 100%)",
          }}
        >
          <Group justify="space-between">
            <Group gap="sm">
              <Group gap={6}>
                <Box w={10} h={10} style={{ borderRadius: "999px", backgroundColor: "#ff5f56" }} />
                <Box w={10} h={10} style={{ borderRadius: "999px", backgroundColor: "#ffbd2e" }} />
                <Box w={10} h={10} style={{ borderRadius: "999px", backgroundColor: "#27c93f" }} />
              </Group>
              <Text size="sm" fw={600} c="gray.2">
                {title}
              </Text>
              <Badge size="sm" color={statusColor[connectionState]} variant="dot">
                {statusLabel[connectionState]}
              </Badge>
              <Badge size="sm" variant="light" color="gray">
                {effectiveMode === "interactive" ? "Shell" : "Stream"}
              </Badge>
            </Group>
            <Group gap="xs">
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={() => xtermRef.current?.clear()}
                aria-label="Clear terminal"
                title="Clear"
              >
                <IconTrash size={15} />
              </ActionIcon>
              {onClose && (
                <ActionIcon variant="subtle" color="gray" onClick={onClose} size="sm" aria-label="Close terminal" title="Close">
                  <IconX size={16} />
                </ActionIcon>
              )}
            </Group>
          </Group>
        </Box>
      )}
      <Box
        ref={terminalRef}
        style={{
          flex: 1,
          minHeight: 0,
          padding: "8px",
          overflow: "hidden",
          background: "#0f1117",
        }}
      />
    </Card>
  );
};
