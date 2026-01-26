import { useEffect, useState } from "react";

export function useAsync(fn, deps) {
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    setError("");

    fn()
      .then((d) => {
        if (!alive) return;
        setData(d);
        setStatus("success");
      })
      .catch((e) => {
        if (!alive) return;
        setError(e?.message || "Something went wrong");
        setStatus("error");
      });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { status, data, error };
}
