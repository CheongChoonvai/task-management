"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TestUserSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .or(`email.ilike.%${trimmed}%,full_name.ilike.%${trimmed}%`);
    if (error) {
      setError(error.message);
    } else {
      setResults(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-4">Test User Search</h1>
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          type="text"
          className="px-4 py-2 border rounded-lg"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg"
          disabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <ul className="w-full max-w-md">
        {results.map(u => (
          <li key={u.id} className="border-b py-2 flex justify-between items-center">
            <span>{u.full_name || u.email}</span>
            <span className="text-xs text-gray-500">{u.email}</span>
          </li>
        ))}
      </ul>
      {results.length === 0 && !loading && !error && (
        <div className="text-gray-500 mt-4">No results</div>
      )}
    </div>
  );
}
