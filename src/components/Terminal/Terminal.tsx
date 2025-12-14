"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import type { Terminal as XTerm } from "xterm";
import type { FitAddon } from "@xterm/addon-fit";
import { Card, Badge, Group, ActionIcon, Text, Box } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { connectToSession } from "@/lib/shellClient";
import "xterm/css/xterm.css";

interface TerminalProps {
  sessionId?: string;
  socketFactory?: () => WebSocket;
  onClose?: () => void;
  title?: string;
}

export const Terminal: React.FC<TerminalProps> = ({ sessionId, socketFactory, onClose, title = "Terminal" }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!terminalRef.current) return;
    if (!sessionId && !socketFactory) return;

    let term: XTerm;
    let fitAddon: FitAddon;
    let ws: WebSocket;

    const initTerminal = async () => {
      const { Terminal: XTermConstructor } = await import("xterm");
      const { FitAddon: FitAddonConstructor } = await import("@xterm/addon-fit");
      const { WebLinksAddon: WebLinksAddonConstructor } = await import("@xterm/addon-web-links");

      // Initialize xterm.js
      term = new XTermConstructor({
        cursorBlink: true,
        convertEol: true,
        fontSize: 14,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        theme: {
          background: "#1e1e1e",
          foreground: "#f0f0f0",
          cursor: "#4caf50",
          black: "#000000",
          red: "#e06c75",
          green: "#98c379",
          yellow: "#d19a66",
          blue: "#61afef",
          magenta: "#c678dd",
          cyan: "#56b6c2",
          white: "#abb2bf",
          brightBlack: "#5c6370",
          brightRed: "#e06c75",
          brightGreen: "#98c379",
          brightYellow: "#d19a66",
          brightBlue: "#61afef",
          brightMagenta: "#c678dd",
          brightCyan: "#56b6c2",
          brightWhite: "#ffffff",
        },
        allowProposedApi: true,
      });

      // Add addons
      fitAddon = new FitAddonConstructor();
      const webLinksAddon = new WebLinksAddonConstructor();

      term.loadAddon(fitAddon);
      term.loadAddon(webLinksAddon);

      // Open terminal
      if (terminalRef.current) {
        term.open(terminalRef.current);
        fitAddon.fit();
      }

      xtermRef.current = term;
      fitAddonRef.current = fitAddon;

      // Connect to WebSocket
      ws = socketFactory ? socketFactory() : connectToSession(sessionId!);

      const commandBuffer = { current: "" };
      const prompt = title?.toLowerCase().includes("install") ? "" : "# ";

      ws.onopen = () => {
        setIsConnected(true);
        term.writeln("\x1b[1;32m● Connected to shell session\x1b[0m");
        if (prompt) {
          term.write(`\r\n${prompt}`);
        }
      };

      ws.onmessage = async (event) => {
        let rawData = event.data;

        // Handle Blob/ArrayBuffer if necessary
        if (rawData instanceof Blob) {
          rawData = await rawData.text();
        }

        let message;
        try {
          message = JSON.parse(rawData);
        } catch (error) {
          // If parsing fails, assume it's raw text output
          if (typeof rawData === "string") {
            term.write(rawData);
          }
          return;
        }

        if (message.type === "output") {
          term.writeln(message.data.output);
        } else if (message.type === "log") {
          // Handle job logs
          term.writeln(message.data.output);
        } else if (message.type === "error") {
          term.writeln(`\x1b[1;31mError: ${message.message}\x1b[0m`);
        } else if (message.type === "exit") {
          term.writeln("");
          term.writeln(`\x1b[1;33m● Session ended with exit code: ${message.data.exit_code}\x1b[0m`);
          setIsConnected(false);
        } else if (message.type === "job_completed") {
          term.writeln("");
          const color = message.data.status === "completed" ? "\x1b[1;32m" : "\x1b[1;31m";
          term.writeln(`${color}● Job ${message.data.status} (Exit Code: ${message.data.exit_code})\x1b[0m`);
          setIsConnected(false);
          // Keep the socket open for a moment or let the user close it?
          // The requirement says "Close connection when job_completed message is received".
          // setIsConnected(false) updates the UI badge.
          // We might want to actually close the socket if the server doesn't.
          ws.close();
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        term.writeln("");
        term.writeln("\x1b[1;31m○ Disconnected from shell session\x1b[0m");
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
        term.writeln("");
        term.writeln("\x1b[1;31m✗ Connection error\x1b[0m");
      };

      wsRef.current = ws;

      // Handle terminal input with local buffering
      term.onData((data) => {
        if (ws.readyState !== WebSocket.OPEN) return;

        const code = data.charCodeAt(0);

        // Enter (13)
        if (code === 13) {
          term.write("\r\n");
          // Send the command followed by a newline
          ws.send(
            JSON.stringify({
              type: "input",
              data: commandBuffer.current + "\r",
            }),
          );
          commandBuffer.current = "";
          return;
        }

        // Backspace (127)
        if (code === 127) {
          if (commandBuffer.current.length > 0) {
            commandBuffer.current = commandBuffer.current.slice(0, -1);
            term.write("\b \b");
          }
          return;
        }

        // Printable characters (basic range check, can be expanded for utf8)
        if (code >= 32) {
          commandBuffer.current += data;
          term.write(data);
        }
      });
    };

    initTerminal();

    // Handle window resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && xtermRef.current) {
        wsRef.current.send(
          JSON.stringify({
            type: "resize",
            cols: xtermRef.current.cols,
            rows: xtermRef.current.rows,
          }),
        );
      }
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (xtermRef.current) {
        xtermRef.current.dispose();
      }
    };
  }, [sessionId, socketFactory, title]);

  return (
    <Card shadow="sm" padding="0" radius="md" withBorder>
      <Box p="xs" style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}>
        <Group justify="space-between">
          <Group gap="xs">
            <Text size="sm" fw={500}>
              {title}
            </Text>
            <Badge size="sm" color={isConnected ? "green" : "gray"} variant="dot">
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </Group>
          {onClose && (
            <ActionIcon variant="subtle" color="gray" onClick={onClose} size="sm">
              <IconX size={16} />
            </ActionIcon>
          )}
        </Group>
      </Box>
      <Box
        ref={terminalRef}
        style={{
          height: "500px",
          padding: "8px",
          overflow: "hidden",
        }}
      />
    </Card>
  );
};
