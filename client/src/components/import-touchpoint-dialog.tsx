import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Upload, X, Zap, FileUp } from "lucide-react";
import * as XLSX from "xlsx";

interface ImportRow {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  touchpointLeadId?: string;
  source?: string;
  [key: string]: string | undefined;
}

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
}

// Simple CSV parser
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (current || row.length > 0) {
        row.push(current.trim());
        rows.push(row);
        row = [];
        current = "";
      }
      if (char === "\r" && nextChar === "\n") i++;
    } else {
      current += char;
    }
  }

  if (current || row.length > 0) {
    row.push(current.trim());
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell));
}

// Fuzzy match column header
function findColumnIndex(headers: string[], patterns: string[]): number {
  const normalized = headers.map((h) => h.toLowerCase());
  for (const pattern of patterns) {
    const idx = normalized.findIndex((h) => h.includes(pattern.toLowerCase()));
    if (idx !== -1) return idx;
  }
  return -1;
}

// Map CSV rows to import data
function mapRowsToImportData(headers: string[], rows: string[][]): ImportRow[] {
  const firstNameIdx = findColumnIndex(headers, ["first", "given"]);
  const lastNameIdx = findColumnIndex(headers, ["last", "surname", "family"]);
  const phoneIdx = findColumnIndex(headers, ["phone", "mobile", "cell"]);
  const emailIdx = findColumnIndex(headers, ["email"]);
  const addressIdx = findColumnIndex(headers, ["address", "street"]);
  const cityIdx = findColumnIndex(headers, ["city"]);
  const stateIdx = findColumnIndex(headers, ["state", "province"]);
  const zipIdx = findColumnIndex(headers, ["zip", "postal", "code"]);
  const leadIdIdx = findColumnIndex(headers, ["lead id", "lead", "id"]);
  const sourceIdx = findColumnIndex(headers, ["source", "channel", "origin"]);

  return rows.map((row) => {
    // Try to extract name from a single "Customer Name" or "Lead Name" column
    let firstName = firstNameIdx >= 0 ? row[firstNameIdx] : "";
    let lastName = lastNameIdx >= 0 ? row[lastNameIdx] : "";

    // If no separate name columns, look for combined name columns
    if (!firstName && !lastName) {
      const nameIdx = findColumnIndex(headers, ["customer name", "lead name", "name"]);
      if (nameIdx >= 0) {
        const nameParts = row[nameIdx]?.split(/\s+/) || [];
        firstName = nameParts[0] || "";
        lastName = nameParts.slice(1).join(" ");
      }
    }

    return {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      phone: phoneIdx >= 0 ? row[phoneIdx] || undefined : undefined,
      email: emailIdx >= 0 ? row[emailIdx] || undefined : undefined,
      address: addressIdx >= 0 ? row[addressIdx] || undefined : undefined,
      city: cityIdx >= 0 ? row[cityIdx] || undefined : undefined,
      state: stateIdx >= 0 ? row[stateIdx] || undefined : undefined,
      zip: zipIdx >= 0 ? row[zipIdx] || undefined : undefined,
      touchpointLeadId: leadIdIdx >= 0 ? row[leadIdIdx] || undefined : undefined,
      source: sourceIdx >= 0 ? row[sourceIdx] || undefined : undefined,
    };
  });
}

export function ImportTouchpointDialog({ open, onClose }: ImportDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = useState("");
  const [parsedData, setParsedData] = useState<ImportRow[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const [updatedCount, setUpdatedCount] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [mode, setMode] = useState<"choose" | "manual" | "auto">("choose");
  const [autoRunning, setAutoRunning] = useState(false);

  function readFile(file: File) {
    const name = file.name.toLowerCase();
    const isExcel = name.endsWith(".xlsx") || name.endsWith(".xls");
    const isCsv = name.endsWith(".csv");

    if (!isExcel && !isCsv) {
      toast({
        title: "Unsupported file",
        description: "Please select a .csv, .xlsx, or .xls file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (isExcel) {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const csv = XLSX.utils.sheet_to_csv(firstSheet);
          setCsvText(csv);
          processCSV(csv);
        } else {
          const text = e.target?.result as string;
          setCsvText(text);
          processCSV(text);
        }
      } catch (err: any) {
        toast({
          title: "Could not read file",
          description: err?.message || "Something went wrong parsing the file.",
          variant: "destructive",
        });
      }
    };
    reader.onerror = () => {
      toast({ title: "Failed to read file", variant: "destructive" });
    };
    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest<{ imported: number; updated: number; errors: string[] }>("/api/clients/import-touchpoint", {
        method: "POST",
        body: JSON.stringify({ rows: parsedData }),
      });
      return res;
    },
    onSuccess: (result) => {
      setImportedCount(result?.imported || 0);
      setUpdatedCount(result?.updated || 0);
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Import successful",
        description: `Imported ${result?.imported || 0} new leads, updated ${result?.updated || 0}.`,
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error.message || "An error occurred during import.",
        variant: "destructive",
      });
    },
  });

  function handleClose() {
    setCsvText("");
    setParsedData([]);
    setImportedCount(0);
    setUpdatedCount(0);
    setMode("choose");
    setAutoRunning(false);
    onClose();
  }

  async function runAutoImport() {
    setAutoRunning(true);
    try {
      const res = await apiRequest<{ imported: number; updated: number; errors: string[]; status: string }>(
        "/api/clients/sync-touchpoint",
        { method: "POST", body: JSON.stringify({}) },
      );
      if (res?.status === "not_configured") {
        toast({
          title: "Auto-sync not set up yet",
          description: "The automated TouchPoint sync script hasn't been configured on this machine. Use Manual Upload for now — we'll wire up auto-sync in the next step.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Auto-sync complete",
          description: `Imported ${res?.imported || 0} new leads, updated ${res?.updated || 0}.`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
        handleClose();
      }
    } catch (err: any) {
      toast({
        title: "Auto-sync failed",
        description: err?.message || "Could not reach the sync endpoint.",
        variant: "destructive",
      });
    } finally {
      setAutoRunning(false);
    }
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    readFile(file);
  }

  function processCSV(text: string) {
    try {
      const allRows = parseCSV(text);
      if (allRows.length < 2) {
        toast({
          title: "Invalid file",
          description: "CSV must have headers and at least one data row.",
          variant: "destructive",
        });
        return;
      }

      const headers = allRows[0];
      const dataRows = allRows.slice(1);
      const mapped = mapRowsToImportData(headers, dataRows);
      setParsedData(mapped);
    } catch (error) {
      toast({
        title: "Parse error",
        description: "Failed to parse CSV file.",
        variant: "destructive",
      });
    }
  }

  const previewRows = parsedData.slice(0, 5);
  const totalValidRows = parsedData.filter((r) => r.firstName || r.lastName).length;
  const existingLeads = parsedData.filter((r) => r.touchpointLeadId).length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import from TouchPoint</DialogTitle>
        </DialogHeader>

        {!csvText && mode === "choose" && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground text-center">
              Choose how you want to import leads from TouchPoint.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode("manual")}
                className="border-2 rounded-lg p-5 text-left hover:border-[hsl(var(--primary))] hover:bg-muted/30 transition-colors group"
              >
                <FileUp className="w-7 h-7 mb-2 text-[hsl(var(--primary))]" />
                <p className="font-semibold mb-1">Manual Upload</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Drop a CSV you exported from TouchPoint. Full control — you choose exactly which file to import.
                </p>
              </button>
              <button
                type="button"
                onClick={runAutoImport}
                disabled={autoRunning}
                className="border-2 rounded-lg p-5 text-left hover:border-[hsl(var(--primary))] hover:bg-muted/30 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-7 h-7 mb-2 text-amber-500" />
                <p className="font-semibold mb-1">
                  {autoRunning ? "Syncing..." : "Auto Import"}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  One click — the app logs into TouchPoint and pulls the latest leads automatically. (Requires sync script to be configured.)
                </p>
              </button>
            </div>
          </div>
        )}

        {!csvText && mode === "manual" && (
          <div className="space-y-3 py-4">
            <button
              type="button"
              onClick={() => setMode("choose")}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              ← Back
            </button>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragOver ? "bg-blue-50 border-blue-400" : "hover:bg-muted/50"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">
                {isDragOver ? "Release to upload" : "Drop your CSV file here or click to select"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Supports .csv, .xlsx, and .xls files from TouchPoint exports.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {csvText && parsedData.length > 0 && (
          <div className="space-y-6 py-4">
            {/* Summary */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <p className="text-sm font-medium">
                Ready to import <strong>{totalValidRows}</strong> leads
                {existingLeads > 0 && (
                  <span>, matching {existingLeads} existing by Lead ID</span>
                )}
              </p>
            </Card>

            {/* Preview Table */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preview (first 5 rows)</Label>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted border-b">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Name</th>
                      <th className="px-3 py-2 text-left font-medium">Phone</th>
                      <th className="px-3 py-2 text-left font-medium">Email</th>
                      <th className="px-3 py-2 text-left font-medium">Lead ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-b hover:bg-muted/30">
                        <td className="px-3 py-2">{row.firstName} {row.lastName}</td>
                        <td className="px-3 py-2 text-muted-foreground text-xs">{row.phone}</td>
                        <td className="px-3 py-2 text-muted-foreground text-xs">{row.email}</td>
                        <td className="px-3 py-2 text-muted-foreground text-xs">{row.touchpointLeadId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  ... and {parsedData.length - 5} more
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            {csvText ? "Cancel" : "Close"}
          </Button>
          {csvText && (
            <>
              <Button variant="outline" onClick={() => {
                setCsvText("");
                setParsedData([]);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}>
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <Button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || totalValidRows === 0}
              >
                {mutation.isPending ? "Importing..." : "Import"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
