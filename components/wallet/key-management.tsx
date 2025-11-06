"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Upload, Key, Eye, EyeOff, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  exportWalletKeys,
  importWalletKeys,
  downloadWalletKeys,
  getPublicViewKey,
  getOrCreateWalletKeys,
} from "@/lib/note-manager";

export default function KeyManagement() {
  const [showKeys, setShowKeys] = useState(false);
  const [publicViewKey, setPublicViewKey] = useState("");
  const [copiedPvk, setCopiedPvk] = useState(false);

  useEffect(() => {
    try {
      const pvk = getPublicViewKey();
      setPublicViewKey(pvk);
    } catch (e) {
      // console.error("Failed to load public view key:", e);
    }
  }, []);

  const handleDownloadKeys = () => {
    try {
      downloadWalletKeys();
      toast.success("Keys exported successfully");
    } catch (error) {
      toast.error("Failed to export keys: " + (error as Error).message);
    }
  };

  const handleImportKeys = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      importWalletKeys(text);
      toast.success("Keys imported successfully");
      
      // Reload public view key
      const pvk = getPublicViewKey();
      setPublicViewKey(pvk);
      
      // Reset file input
      e.target.value = "";
    } catch (error) {
      toast.error("Invalid keys file: " + (error as Error).message);
    }
  };

  const handleCopyPvk = async () => {
    try {
      await navigator.clipboard.writeText(publicViewKey);
      setCopiedPvk(true);
      toast.success("Public view key copied");
      setTimeout(() => setCopiedPvk(false), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const handleShowKeys = () => {
    if (!showKeys) {
      const confirmed = window.confirm(
        "WARNING: This will display your secret keys. Make sure no one is watching your screen. Continue?"
      );
      if (confirmed) {
        setShowKeys(true);
      }
    } else {
      setShowKeys(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Key Management
        </CardTitle>
        <CardDescription>
          Manage your Cloak wallet keys. Your keys are stored locally and never leave your device.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Public View Key */}
        <div className="space-y-2">
          <Label>Public View Key (Share to Receive)</Label>
          <div className="flex gap-2">
            <Input
              value={publicViewKey}
              readOnly
              className="font-mono text-xs"
              placeholder="Loading..."
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyPvk}
              title="Copy public view key"
            >
              {copiedPvk ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Share this key with senders so they can encrypt notes for you.
          </p>
        </div>

        {/* Key Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handleDownloadKeys}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Keys
          </Button>
          
          <label htmlFor="import-keys" className="cursor-pointer">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => document.getElementById("import-keys")?.click()}
              type="button"
            >
              <Upload className="mr-2 h-4 w-4" />
              Import Keys
            </Button>
            <input
              id="import-keys"
              type="file"
              accept=".json"
              onChange={handleImportKeys}
              className="hidden"
            />
          </label>
        </div>

        {/* Show/Hide Secret Keys */}
        <div>
          <Button
            variant="outline"
            onClick={handleShowKeys}
            className="w-full"
          >
            {showKeys ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Hide Secret Keys
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Show Secret Keys
              </>
            )}
          </Button>
        </div>

        {/* Secret Keys Display */}
        {showKeys && (
          <div className="space-y-3 rounded-lg border-2 border-red-500 bg-red-50 p-4 dark:bg-red-950">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">SECRET KEYS - DO NOT SHARE</span>
            </div>
            
            <SecretKeyDisplay
              label="Master Seed"
              value={getOrCreateWalletKeys().master.seedHex}
            />
            <SecretKeyDisplay
              label="Spend Key"
              value={getOrCreateWalletKeys().spend.sk_spend_hex}
            />
            <SecretKeyDisplay
              label="View Key Secret"
              value={getOrCreateWalletKeys().view.vk_secret_hex}
            />
          </div>
        )}

        {/* Warning */}
        <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100">
          <p className="font-medium mb-1">⚠️ Security Warning</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Export and backup your keys to a secure location</li>
            <li>Never share your secret keys with anyone</li>
            <li>Losing your keys means losing access to your notes</li>
            <li>Public view key is safe to share for receiving notes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function SecretKeyDisplay({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-red-600 dark:text-red-400">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          readOnly
          className="font-mono text-xs bg-white dark:bg-gray-900"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopy}
        >
          {copied ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

function AlertCircle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}

