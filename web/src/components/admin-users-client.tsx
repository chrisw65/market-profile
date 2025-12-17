"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  createdAt: string;
  lastSignIn: string | null;
  emailConfirmed: boolean;
}

export function AdminUsersClient() {
  const { user: currentUser, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading && (!currentUser || !isAdmin)) {
      router.push("/dashboard");
    }
  }, [authLoading, currentUser, isAdmin, router]);

  useEffect(() => {
    if (currentUser && isAdmin) {
      fetchUsers();
    }
  }, [currentUser, isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    if (userId === currentUser?.id) {
      alert("You cannot remove your own admin privileges.");
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to ${currentStatus ? "revoke" : "grant"} admin privileges for this user?`
    );

    if (!confirmed) return;

    setUpdatingUserId(userId);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isAdmin: !currentStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update user");
      }

      // Refresh users list
      await fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-zinc-600">Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-zinc-900">
                User Management
              </h1>
              <p className="mt-2 text-zinc-600">
                Manage user accounts and admin privileges
              </p>
            </div>
            <button
              onClick={fetchUsers}
              className="rounded-2xl bg-pink-500 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-400"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by email or name..."
            className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-pink-400 focus:outline-none"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-xl bg-pink-50 p-4 text-sm text-pink-600">
            {error}
          </div>
        )}

        {/* Users Table */}
        <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mb-4 text-4xl">👥</div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-900">
                {searchQuery ? "No users found" : "No users yet"}
              </h3>
              <p className="text-sm text-zinc-600">
                {searchQuery
                  ? "Try a different search query"
                  : "Users will appear here once they sign up"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-zinc-200 bg-zinc-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                      Last Sign In
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
                      Role
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-zinc-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {filteredUsers.map((user) => {
                    const isCurrentUser = user.id === currentUser?.id;
                    const isUpdating = updatingUserId === user.id;

                    return (
                      <tr key={user.id} className="hover:bg-zinc-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div>
                              <div className="font-medium text-zinc-900">
                                {user.name || "—"}
                                {isCurrentUser && (
                                  <span className="ml-2 text-xs text-pink-500">
                                    (You)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600">
                          {user.email}
                        </td>
                        <td className="px-6 py-4">
                          {user.emailConfirmed ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600">
                          {user.lastSignIn
                            ? new Date(user.lastSignIn).toLocaleDateString()
                            : "Never"}
                        </td>
                        <td className="px-6 py-4">
                          {user.isAdmin ? (
                            <span className="inline-flex items-center rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-medium text-pink-800">
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800">
                              User
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() =>
                              toggleAdminStatus(user.id, user.isAdmin)
                            }
                            disabled={isCurrentUser || isUpdating}
                            className="rounded-lg bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isUpdating
                              ? "Updating..."
                              : user.isAdmin
                              ? "Revoke Admin"
                              : "Make Admin"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stats */}
        {users.length > 0 && (
          <div className="mt-6 flex gap-4 text-sm text-zinc-600">
            <div>
              Total Users: <span className="font-semibold">{users.length}</span>
            </div>
            <div>
              Admins:{" "}
              <span className="font-semibold">
                {users.filter((u) => u.isAdmin).length}
              </span>
            </div>
            <div>
              Regular Users:{" "}
              <span className="font-semibold">
                {users.filter((u) => !u.isAdmin).length}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
