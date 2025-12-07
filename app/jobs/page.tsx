"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Job = {
  id: string;
  name: string;
  client_name: string | null;
  status: string | null;
  created_at: string;
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [status, setStatus] = useState("active");

  async function loadJobs() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("jobs")
      .select("id, name, client_name, status, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setError("Failed to load jobs.");
    } else {
      setJobs(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadJobs();
  }, []);

  async function handleCreateJob(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const { error } = await supabase.from("jobs").insert({
      name: name.trim(),
      client_name: clientName.trim() || null,
      status: status || "active",
    });

    if (error) {
      console.error(error);
      setError("Failed to create job.");
      return;
    }

    setName("");
    setClientName("");
    setStatus("active");
    await loadJobs();
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "1.5rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 600, marginBottom: "1rem" }}>
        Jobs
      </h1>

      <form
        onSubmit={handleCreateJob}
        style={{
          marginBottom: "2rem",
          padding: "1rem",
          border: "1px solid #ddd",
          borderRadius: 8,
        }}
      >
        <h2 style={{ marginBottom: "0.75rem" }}>Add Job</h2>

        <div style={{ marginBottom: "0.75rem" }}>
          <label>
            Job Name*<br />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", padding: "0.4rem" }}
              required
            />
          </label>
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label>
            Client Name<br />
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              style={{ width: "100%", padding: "0.4rem" }}
            />
          </label>
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label>
            Status<br />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ width: "100%", padding: "0.4rem" }}
            >
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </label>
        </div>

        <button type="submit">Save Job</button>
      </form>

      {loading && <p>Loading jobs…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {jobs.length === 0 && !loading && <p>No jobs yet.</p>}

      {jobs.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Job</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Client</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{job.name}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                  {job.client_name || "—"}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                  {job.status || "active"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

