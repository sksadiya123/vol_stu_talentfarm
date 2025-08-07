// client/src/lib/delete-session.ts

export async function deleteSession(sessionId: number) {
  const res = await fetch(`/api/sessions/${sessionId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to delete session");
  }

  return res.json();
}
