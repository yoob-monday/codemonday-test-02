export function formatDate(date: string) {
  const localDate = date.includes("T") ? new Date(date) : new Date(`${date}T00:00:00`);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(localDate);
}
