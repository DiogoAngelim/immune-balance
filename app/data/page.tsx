"use client";

import type React from "react";

import { Navigation } from "@/components/navigation";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileJson, FileSpreadsheet, Download, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface DataSource {
  id: string
  name: string
  type: "csv" | "json"
  uploadedAt: string
  recordCount: number
  status: "processed" | "processing"
}

const initialDataSources: DataSource[] = [];

export default function DataPage() {
  const [dataSources, setDataSources] = useState<DataSource[]>(initialDataSources);

  // Compute the most recent update time (must be after dataSources is defined)
  // Only consider dataSources with a valid uploadedAt date
  const validDates = dataSources
    .map(ds => ds.uploadedAt)
    .filter(dateStr => dateStr && dateStr.trim() !== "")
    .map(dateStr => new Date(dateStr))
    .filter(date => !isNaN(date.getTime()));
  const lastUpdated = (dataSources.length > 0 && validDates.length > 0)
    ? validDates.reduce((a, b) => (a > b ? a : b))
    : null;
  function timeAgo(date: Date) {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  }
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  // Manual entry modal state
  const [manualOpen, setManualOpen] = useState(false);
  const [manualValues, setManualValues] = useState({
    date: "",
    crp: "",
    wbc: "",
    esr: "",
    neutrophil: "",
    lymphocyte: "",
    ferritin: "",
    il6: "",
    il10: "",
    treg: "",
    tgfBeta: "",
    notes: ""
  });
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setManualValues({ ...manualValues, [e.target.name]: e.target.value });
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualSubmitting(true);
    try {
      const res = await fetch("/api/parse-data/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manualValues),
      });
      if (!res.ok) throw new Error("Failed to save manual entry");
      const result = await res.json();
      setDataSources((prev) => [
        {
          id: Date.now().toString(),
          name: `Manual entry (${manualValues.date})`,
          type: "json",
          uploadedAt: new Date().toLocaleString(),
          recordCount: 1,
          status: "processed",
        },
        ...prev,
      ]);
      setManualOpen(false);
      setManualValues({ date: "", crp: "", wbc: "", esr: "", neutrophil: "", lymphocyte: "", ferritin: "", il6: "", il10: "", treg: "", tgfBeta: "", notes: "" });
    } catch (err) {
      alert("Error saving manual entry");
    } finally {
      setManualSubmitting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };


  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const file = files[0];
      const formData = new FormData();
      formData.append("file", file);
      // Call the API route that will parse and standardize the file using OpenAI
      const res = await fetch("/api/parse-data", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to parse file");
      const result = await res.json();
      // Add the new data source to the list (simulate for now)
      setDataSources((prev) => [
        {
          id: Date.now().toString(),
          name: file.name,
          type: file.name.endsWith(".csv") ? "csv" : "json",
          uploadedAt: new Date().toLocaleString(),
          recordCount: result.recordCount || 0,
          status: "processed",
        },
        ...prev,
      ]);
    } catch (err) {
      alert("Error uploading or parsing file");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  useEffect(() => {
    // Fetch all reports from backend
    fetch("/api/reports")
      .then(res => res.json())
      .then(reports => {
        // Map backend reports to DataSource format
        const backendSources = Array.isArray(reports) ? reports.map(r => ({
          id: r.id || r.content || Math.random().toString(),
          name: r.reportName || r.content?.slice(0, 40) || "Lab Report",
          type: "json" as const,
          uploadedAt: r.createdAt ? new Date(r.createdAt).toLocaleString() : "",
          recordCount: Array.isArray(r.parsed?.signals) ? r.parsed.signals.length : 0,
          status: "processed" as const,
        })) : [];
        setDataSources(backendSources);
      });
  }, []);

  function renderPage() {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Data</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage your lab results and data sources</p>
              {lastUpdated && (
                <p className="text-xs text-muted-foreground mt-1">Last updated: {timeAgo(lastUpdated)}</p>
              )}
            </div>
            {dataSources.length > 0 && (
              <Button
                variant="outline"
                className="gap-2 bg-transparent"
                onClick={() => {
                  fetch("/api/export-all")
                    .then(res => res.blob())
                    .then(blob => {
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "export-all-data.json";
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      window.URL.revokeObjectURL(url);
                    });
                }}
              >
                <Download className="w-4 h-4" />
                Export all data
              </Button>
            )}
          </div>

          {/* Upload area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "rounded-xl border-2 border-dashed p-8 mb-8 transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-border bg-card",
            )}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">Upload lab results</h3>
              <p className="text-sm text-muted-foreground mb-4">Drag and drop your files here, or click to browse</p>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Uploading..." : "Choose files"}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.json,.pdf"
                    style={{ display: "none" }}
                    onChange={e => handleFiles(e.target.files)}
                    disabled={uploading}
                  />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">Supported formats: CSV, JSON</p>
            </div>
          </div>

          {/* Manual entry */}
          <div className="rounded-xl bg-card border border-border p-6 mb-8">
            <h3 className="text-lg font-medium text-foreground mb-2">Manual entry</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter lab values manually if you prefer not to upload files
            </p>
            <Button variant="outline" onClick={() => setManualOpen(true)}>Open structured entry form</Button>
            {manualOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <form onSubmit={handleManualSubmit} className="bg-card rounded-xl border border-border p-8 w-full max-w-md shadow-xl">
                  <h4 className="text-lg font-medium mb-4">Manual Lab Entry</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="col-span-2">
                      <label className="block text-xs mb-1">Date</label>
                      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                          <input
                            type="text"
                            name="date"
                            value={manualValues.date}
                            readOnly
                            placeholder="Select date"
                            className="w-full px-2 py-1 border rounded text-sm cursor-pointer"
                            onClick={() => setCalendarOpen(true)}
                          />
                        </PopoverTrigger>
                        <PopoverContent align="start" className="p-0 w-auto">
                          <Calendar
                            mode="single"
                            selected={manualValues.date ? new Date(manualValues.date) : undefined}
                            onSelect={date => {
                              if (date) {
                                setManualValues(v => ({ ...v, date: date.toISOString().slice(0, 10) }));
                                setCalendarOpen(false);
                              }
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    {/* Input with unit inside */}
                    <div>
                      <label className="block text-xs mb-1">CRP</label>
                      <div className="relative">
                        <input type="text" name="crp" value={manualValues.crp} onChange={handleManualChange} className="w-full px-2 py-1 pr-16 border rounded text-sm" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">mg/L</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs mb-1">WBC</label>
                      <div className="relative">
                        <input type="text" name="wbc" value={manualValues.wbc} onChange={handleManualChange} className="w-full px-2 py-1 pr-16 border rounded text-sm" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">10^9/L</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs mb-1">ESR</label>
                      <div className="relative">
                        <input type="text" name="esr" value={manualValues.esr} onChange={handleManualChange} className="w-full px-2 py-1 pr-16 border rounded text-sm" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">mm/hr</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Neutrophil</label>
                      <div className="relative">
                        <input type="text" name="neutrophil" value={manualValues.neutrophil} onChange={handleManualChange} className="w-full px-2 py-1 pr-16 border rounded text-sm" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">10^9/L</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Lymphocyte</label>
                      <div className="relative">
                        <input type="text" name="lymphocyte" value={manualValues.lymphocyte} onChange={handleManualChange} className="w-full px-2 py-1 pr-16 border rounded text-sm" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">10^9/L</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Ferritin</label>
                      <div className="relative">
                        <input type="text" name="ferritin" value={manualValues.ferritin} onChange={handleManualChange} className="w-full px-2 py-1 pr-16 border rounded text-sm" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ng/mL</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs mb-1">IL-6</label>
                      <div className="relative">
                        <input type="text" name="il6" value={manualValues.il6} onChange={handleManualChange} className="w-full px-2 py-1 pr-16 border rounded text-sm" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">pg/mL</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs mb-1">IL-10</label>
                      <div className="relative">
                        <input type="text" name="il10" value={manualValues.il10} onChange={handleManualChange} className="w-full px-2 py-1 pr-16 border rounded text-sm" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">pg/mL</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Treg</label>
                      <div className="relative">
                        <input type="text" name="treg" value={manualValues.treg} onChange={handleManualChange} className="w-full px-2 py-1 pr-16 border rounded text-sm" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">% of CD4+ T cells</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs mb-1">TGF-beta</label>
                      <div className="relative">
                        <input type="text" name="tgfBeta" value={manualValues.tgfBeta} onChange={handleManualChange} className="w-full px-2 py-1 pr-16 border rounded text-sm" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ng/mL</span>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs mb-1">Notes</label>
                    <textarea name="notes" value={manualValues.notes} onChange={handleManualChange} className="w-full px-2 py-1 border rounded text-sm" rows={2} />
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Button type="submit" disabled={manualSubmitting}>{manualSubmitting ? "Saving..." : "Save"}</Button>
                    <Button variant="ghost" type="button" onClick={() => setManualOpen(false)}>Cancel</Button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Data source history */}
          {dataSources.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">Data source history</h3>
              <div className="space-y-3">
                {dataSources.map((source) => (
                  <div key={source.id} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      {source.type === "csv" ? (
                        <FileSpreadsheet className="w-5 h-5 text-chart-2" />
                      ) : (
                        <FileJson className="w-5 h-5 text-chart-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{source.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {source.uploadedAt}
                        </span>
                        <span>{source.recordCount} records</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {source.status === "processed" ? (
                        <span className="flex items-center gap-1 text-xs text-chart-2">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Processed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-chart-3">
                          <Clock className="w-3.5 h-3.5" />
                          Processing
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return renderPage();
}
