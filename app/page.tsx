"use client";

import { useState, useEffect } from "react";

type TaskType = "marketing" | "regulasi" | "bmc" | "convertation";

interface LineValidation {
  line: number;
  originalText: string;
  isValid: boolean;
  error?: string;
  parsed?: { system: string; instruction: string; input: string; output: string; };
}

interface ResultState {
  type: "success" | "error" | "none";
  message?: string;
  tooManyLines?: boolean;
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"import" | "export" | "guide">("import");

  // IMPORT TAB STATE
  const [task, setTask] = useState<TaskType>("marketing");
  const [rawText, setRawText] = useState("");
  const [contributor, setContributor] = useState("");
  const [validatedLines, setValidatedLines] = useState<LineValidation[]>([]);
  const [importResult, setImportResult] = useState<ResultState>({ type: "none" });
  const [isImporting, setIsImporting] = useState(false);

  // EXPORT TAB STATE
  const [exportTask, setExportTask] = useState<TaskType>("marketing");
  const [isExploded, setIsExploded] = useState(false); // Confirmation state
  const [exportData, setExportData] = useState<any[]>([]);
  const [exportPage, setExportPage] = useState(1);
  const [exportTotalPages, setExportTotalPages] = useState(1);
  const [exportTotalItems, setExportTotalItems] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExportLoading, setIsExportLoading] = useState(false);

  // --- IMPORT TAB LOGIC ---
  const handleValidate = async (textToValidate: string = rawText) => {
    if (!textToValidate.trim()) return;
    setIsImporting(true);
    setImportResult({ type: "none" });
    setValidatedLines([]);
    
    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_type: task, raw_text: textToValidate }),
      });
      const data = await res.json();
      
      setValidatedLines(data.lines || []);
      
      if (data.valid) {
        setImportResult({ type: "success", message: "All rows are valid!" });
      } else {
        setImportResult({ type: "error", message: "Fix invalid rows to proceed.", tooManyLines: data.tooManyLines });
      }
    } catch (e) {
      setImportResult({ type: "error", message: "Network error occurred." });
    } finally {
      setIsImporting(false);
    }
  };

  const handleUpdateRow = (lineIndex: number, newText: string) => {
    // Reconstruct full text and revalidate
    const updatedLines = [...validatedLines];
    updatedLines[lineIndex] = { ...updatedLines[lineIndex], originalText: newText };
    
    const newRawText = updatedLines.map(l => l.originalText).join("\n");
    setRawText(newRawText);
    handleValidate(newRawText);
  };

  const handleSubmit = async () => {
    setIsImporting(true);
    setImportResult({ type: "none" });
    const finalRawText = validatedLines.map(l => l.originalText).join("\n");

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_type: task, raw_text: finalRawText, contributor }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setImportResult({ type: "success", message: `Successfully inserted ${data.inserted} rows.` });
        setRawText(""); 
        setValidatedLines([]);
      } else {
        setImportResult({ type: "error", message: data.error || "Submission failed" });
      }
    } catch (e) {
      setImportResult({ type: "error", message: "Network error occurred." });
    } finally {
      setIsImporting(false);
    }
  };

  const allValid = validatedLines.length > 0 && validatedLines.every(l => l.isValid) && !importResult.tooManyLines;

  // --- EXPORT TAB LOGIC ---
  const fetchExportData = async (pageToFetch: number = exportPage) => {
    setIsExportLoading(true);
    try {
      const res = await fetch(`/api/datasets?task_type=${exportTask}&page=${pageToFetch}&limit=20`);
      const data = await res.json();
      if (data.items) {
        setExportData(data.items);
        setExportTotalPages(data.totalPages);
        setExportTotalItems(data.total);
        setExportPage(data.page);
        setSelectedIds(new Set()); // Reset selections on page change
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportLoading(false);
    }
  };

  useEffect(() => {
    if (isExploded) {
      fetchExportData(1);
    }
  }, [exportTask, isExploded]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(exportData.map(item => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleDownloadSelected = () => {
    const selectedItems = exportData.filter(item => selectedIds.has(item.id));
    if (selectedItems.length === 0) return;

    const jsonlString = selectedItems.map(item => JSON.stringify({
        system: item.system,
        instruction: item.instruction,
        input: item.input,
        output: item.output
    })).join("\n");

    const blob = new Blob([jsonlString], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bismate_export_${exportTask}_${Date.now()}.jsonl`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} rows? This is irreversible.`)) return;

    setIsExportLoading(true);
    try {
      const res = await fetch("/api/datasets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });
      if (res.ok) {
        // Refetch current page
        fetchExportData(exportPage);
      } else {
        alert("Failed to delete.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
        <div>
          <h1 className="title">BisMate Dataset Tool</h1>
          <p className="body-text text-secondary">Internal dataset ingestion and management.</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="btn-group">
            <button 
              className={`btn ${activeTab === "import" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab("import")}
            >
              Import
            </button>
            <button 
              className={`btn ${activeTab === "export" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab("export")}
            >
              Review & Export
            </button>
          </div>
          <div style={{ marginTop: "8px", display: "flex", gap: "12px", justifyContent: "flex-end", alignItems: "center" }}>
            <button 
              onClick={() => setActiveTab("guide")}
              style={{ 
                background: "none", 
                border: "none", 
                color: activeTab === "guide" ? "var(--text-primary)" : "var(--accent)", 
                textDecoration: "underline", 
                cursor: "pointer",
                fontSize: "14px",
                padding: 0
              }}
            >
              Cara Pakai
            </button>
            <span style={{ color: "var(--border)", fontSize: "12px" }}>|</span>
            <button 
              onClick={handleLogout}
              style={{ 
                background: "none", 
                border: "none", 
                color: "var(--text-secondary)", 
                textDecoration: "none", 
                cursor: "pointer",
                fontSize: "14px",
                padding: 0
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {activeTab === "import" && (
        <>
          <div className="card" style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", borderColor: "var(--accent)" }}>
            <h2 className="label" style={{ fontSize: "16px", color: "var(--accent)", margin: 0 }}>✅ Checklist Kualitas</h2>
            <ul className="body-text text-secondary" style={{ margin: "8px 0 0 0", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <li>Semua field terisi: <strong>system, instruction, input, output</strong></li>
              <li>Format JSONL valid per baris atau JSON Array</li>
              <li>Tidak ada duplikat sampel di database</li>
              <li>Menggunakan <strong>Bahasa Indonesia yang natural</strong></li>
              {task === "regulasi" && (
                <li style={{ color: "var(--text-primary)" }}>Untuk Regulasi: input WAJIB mengandung <strong>"Konteks:"</strong> dan <strong>"Pertanyaan:"</strong></li>
              )}
              {task === "marketing" && (
                <li style={{ color: "var(--text-primary)" }}>Untuk Marketing: output WAJIB mengandung <strong>"Strategi"</strong> dan <strong>"Content Calendar"</strong></li>
              )}
              {task === "bmc" && (
                <li style={{ color: "var(--text-primary)" }}>Untuk BMC: WAJIB ada field <strong>"tipe"</strong> bernilai <strong>"CONV"</strong> atau <strong>"JSON"</strong>. Tipe JSON: output berupa objek dengan 9 blok BMC.</li>
              )}
              {task === "convertation" && (
                <li style={{ color: "var(--text-primary)" }}>Untuk Convertation: WAJIB ada field <strong>"tipe"</strong>. Tipe CONV: field <strong>"conversations"</strong> berupa array role/content (min. 5 turn). Tipe JSON: output berupa objek dengan 9 blok BMC.</li>
              )}
            </ul>
          </div>

          <div className="card">
            <div>
              <label className="label">Task Type</label>
              <select 
                className="select" 
                value={task} 
                onChange={(e) => {
                  setTask(e.target.value as TaskType);
                  setValidatedLines([]);
                }}
              >
                <option value="marketing">Marketing</option>
                <option value="regulasi">Regulasi</option>
                <option value="bmc">BMC (Business Model Canvas)</option>
                <option value="convertation">Convertation (CONV + JSON)</option>
              </select>
            </div>

            <div>
              <label className="label">Dataset Array (JSON/JSONL)</label>
              <textarea 
                className="textarea" 
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  setValidatedLines([]);
                }}
                placeholder={'{"system":"...","instruction":"...","input":"...","output":"..."}\n...'}
              />
            </div>

            <div>
              <label className="label">Contributor (Optional)</label>
              <input 
                type="text" 
                className="input" 
                value={contributor}
                onChange={(e) => setContributor(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="btn-group">
              <button 
                className="btn btn-secondary" 
                onClick={() => handleValidate()}
                disabled={isImporting || !rawText.trim()}
              >
                {isImporting ? "Loading..." : "Validate"}
              </button>
            </div>

            {importResult.type !== "none" && (
              <div className={`result-panel ${importResult.type === "success" ? "result-success" : "result-error"}`}>
                {importResult.message}
                {importResult.tooManyLines && <div>Error: Maximum 10 rows exceeded.</div>}
              </div>
            )}
          </div>

          {validatedLines.length > 0 && (
            <div className="card">
              <h2 className="title" style={{ fontSize: "16px", marginBottom: "8px" }}>Valid Dataset Row(s)</h2>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {validatedLines.map((lineObj, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      borderLeft: `4px solid ${lineObj.isValid ? "var(--success)" : "var(--error)"}`,
                      backgroundColor: "var(--background)",
                      padding: "12px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontWeight: 600, fontSize: "14px", color: lineObj.isValid ? "var(--success)" : "var(--error)" }}>
                        Row {lineObj.line}
                      </span>
                      {!lineObj.isValid && lineObj.error && (
                        <span style={{ fontSize: "12px", color: "var(--error)" }}>{lineObj.error}</span>
                      )}
                    </div>

                    {!lineObj.isValid ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <textarea 
                          className="input" 
                          style={{ fontFamily: "monospace", minHeight: "80px", resize: "vertical" }}
                          defaultValue={lineObj.originalText}
                          onBlur={(e) => {
                            if (e.target.value !== lineObj.originalText) {
                              handleUpdateRow(idx, e.target.value);
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div style={{ fontSize: "13px", fontFamily: "monospace", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {lineObj.originalText}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "16px", borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
                <button 
                  className="btn btn-primary" 
                  style={{ width: "100%" }}
                  onClick={handleSubmit}
                  disabled={isImporting || !allValid}
                >
                  {isImporting ? "Submitting..." : "Submit to DB"}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "export" && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <label className="label" style={{ display: "inline-block", marginRight: "12px" }}>Select Dataset</label>
              <select 
                className="select" 
                style={{ width: "auto", display: "inline-block" }}
                value={exportTask} 
                onChange={(e) => {
                  setExportTask(e.target.value as TaskType);
                  setIsExploded(false); // Reset to confirmation state on switch
                }}
              >
                <option value="marketing">Marketing</option>
                <option value="regulasi">Regulasi</option>
                <option value="bmc">BMC (Business Model Canvas)</option>
                <option value="convertation">Convertation (CONV + JSON)</option>
              </select>
            </div>

            <div className="btn-group">
              <a href={`/api/export?task=${exportTask}`} className="btn btn-secondary" target="_blank" style={{ fontSize: "12px" }}>
                Download Complete (Legacy)
              </a>
            </div>
          </div>

          {!isExploded ? (
            <div style={{ padding: "40px", textAlign: "center", backgroundColor: "var(--background)", border: "1px dashed var(--border)" }}>
              <p className="body-text text-secondary" style={{ marginBottom: "16px" }}>
                Querying the database may consume bandwidth for large datasets.
              </p>
              <button className="btn btn-primary" onClick={() => setIsExploded(true)}>
                Load {exportTask === "marketing" ? "Marketing" : exportTask === "regulasi" ? "Regulasi" : exportTask === "bmc" ? "BMC" : "Convertation"} Table
              </button>
            </div>
          ) : (
            <>
              {/* Action Bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", padding: "12px", backgroundColor: "var(--background)" }}>
                <span className="body-text text-secondary" style={{ fontSize: "13px" }}>
                  {exportTotalItems} items found. (Selected: {selectedIds.size})
                </span>
                <div className="btn-group">
                  <button 
                    className="btn btn-secondary" 
                    disabled={selectedIds.size === 0 || isExportLoading}
                    onClick={handleDeleteSelected}
                    style={{ borderColor: "var(--error)", color: "var(--error)" }}
                  >
                    Delete Selected
                  </button>
                  <button 
                    className="btn btn-primary" 
                    disabled={selectedIds.size === 0 || isExportLoading}
                    onClick={handleDownloadSelected}
                  >
                    Download JSONL (Selected)
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div style={{ overflowX: "auto", border: "1px solid var(--border)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                  <thead style={{ backgroundColor: "var(--background)", borderBottom: "1px solid var(--border)" }}>
                    <tr>
                      <th style={{ padding: "8px", width: "40px", textAlign: "center" }}>
                        <input 
                          type="checkbox" 
                          checked={exportData.length > 0 && selectedIds.size === exportData.length}
                          onChange={handleSelectAll}
                        />
                      </th>
                      {(exportTask === "bmc" || exportTask === "convertation") && <th style={{ padding: "8px", borderRight: "1px solid var(--border)" }}>Tipe</th>}
                      <th style={{ padding: "8px", borderRight: "1px solid var(--border)" }}>Instruction</th>
                      <th style={{ padding: "8px", borderRight: "1px solid var(--border)" }}>Input</th>
                      <th style={{ padding: "8px" }}>Output</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isExportLoading ? (
                      <tr><td colSpan={4} style={{ padding: "24px", textAlign: "center" }}>Loading...</td></tr>
                    ) : exportData.length === 0 ? (
                      <tr><td colSpan={4} style={{ padding: "24px", textAlign: "center" }}>No data found.</td></tr>
                    ) : (
                      exportData.map(item => (
                        <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "8px", textAlign: "center", verticalAlign: "top" }}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(item.id)}
                              onChange={() => handleSelectRow(item.id)}
                            />
                          </td>
                          {(exportTask === "bmc" || exportTask === "convertation") && (
                            <td style={{ padding: "8px", borderRight: "1px solid var(--border)", verticalAlign: "top", whiteSpace: "nowrap" }}>
                              {item.tipe || "-"}
                            </td>
                          )}
                          <td style={{ padding: "8px", borderRight: "1px solid var(--border)", verticalAlign: "top" }}>
                            <div style={{ maxHeight: "100px", overflowY: "auto" }}>{item.instruction}</div>
                          </td>
                          <td style={{ padding: "8px", borderRight: "1px solid var(--border)", verticalAlign: "top" }}>
                            <div style={{ maxHeight: "100px", overflowY: "auto" }}>{item.input}</div>
                          </td>
                          <td style={{ padding: "8px", verticalAlign: "top" }}>
                            <div style={{ maxHeight: "100px", overflowY: "auto" }}>{item.output}</div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {exportTotalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
                  <button 
                    className="btn btn-secondary" 
                    disabled={exportPage === 1 || isExportLoading}
                    onClick={() => fetchExportData(exportPage - 1)}
                  >
                    Previous
                  </button>
                  <span className="body-text text-secondary" style={{ fontSize: "14px" }}>
                    Page {exportPage} of {exportTotalPages}
                  </span>
                  <button 
                    className="btn btn-secondary" 
                    disabled={exportPage === exportTotalPages || isExportLoading}
                    onClick={() => fetchExportData(exportPage + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
      {activeTab === "guide" && (
        <div className="card">
          <h2 className="title" style={{ fontSize: "18px" }}>Panduan Penggunaan</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "16px" }}>
            <section>
              <h3 className="label" style={{ color: "var(--text-primary)", marginBottom: "8px" }}>1. Validasi JSON & JSONL</h3>
              <p className="body-text text-secondary">Sistem menerima dua format input:</p>
              <ul className="body-text text-secondary" style={{ paddingLeft: "20px", marginTop: "8px" }}>
                <li><strong>JSONL (JSON Lines):</strong> Setiap baris harus berupa objek JSON yang valid.</li>
                <li><strong>JSON Array:</strong> Struktur <code>[...]</code> standar (copy-paste langsung dari ChatGPT).</li>
              </ul>
              <div style={{ marginTop: "12px", padding: "12px", border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                <p className="body-text" style={{ fontSize: "12px", color: "var(--error)" }}><strong>Common Error:</strong> Pastikan tidak ada koma di baris terakhir JSONL, dan semua baris memiliki kurung kurawal yang lengkap.</p>
              </div>
            </section>

            <section>
              <h3 className="label" style={{ color: "var(--text-primary)", marginBottom: "8px" }}>2. Status Baris Dataset</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "12px" }}>
                <div style={{ border: "1px solid var(--success)", padding: "12px", backgroundColor: "rgba(34, 197, 94, 0.05)" }}>
                  <p className="label" style={{ color: "var(--success)", fontSize: "12px" }}>Contoh Valid (OK)</p>
                  <p className="body-text text-secondary" style={{ fontSize: "11px", fontFamily: "monospace", marginTop: "4px" }}>
                    {"{\"system\":\"...\",\"instruction\":\"...\"}"}
                  </p>
                  <p className="body-text" style={{ fontSize: "11px", marginTop: "8px" }}>Baris akan menciut (collapse) untuk menghemat ruang.</p>
                </div>
                <div style={{ border: "1px solid var(--error)", padding: "12px", backgroundColor: "rgba(239, 68, 68, 0.05)" }}>
                  <p className="label" style={{ color: "var(--error)", fontSize: "12px" }}>Contoh Error (Fix)</p>
                  <textarea readOnly className="input" style={{ fontSize: "11px", height: "40px", marginTop: "4px" }} value={'{"system": "..."'} />
                  <p className="body-text" style={{ fontSize: "11px", marginTop: "8px" }}>Baris terbuka otomatis agar bisa diedit langsung.</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="label" style={{ color: "var(--text-primary)", marginBottom: "8px" }}>3. Cara Memperbaiki Error</h3>
              <ol className="body-text text-secondary" style={{ paddingLeft: "20px" }}>
                <li>Cari baris dengan border <span style={{ color: "var(--error)" }}>Merah</span>.</li>
                <li>Baca pesan error di pojok kanan atas card tersebut.</li>
                <li>Edit teks JSON langsung di dalam kotak input baris tersebut.</li>
                <li>Klik di luar kotak (onBlur) untuk memicu <strong>Re-Validasi otomatis</strong>.</li>
                <li>Tombol <strong>Submit to DB</strong> akan muncul setelah semua baris berwarna Hijau.</li>
              </ol>
            </section>

            <section style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
              <button className="btn btn-secondary" onClick={() => setActiveTab("import")}>Kembali ke Import</button>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
