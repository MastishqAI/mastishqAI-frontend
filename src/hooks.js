import { useCallback, useEffect, useState } from "react";
import api from "./api";

// GET a URL and expose { data, loading, error, reload }
export function useGet(url) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    api.get(url)
      .then((data) => setState({ data, loading: false, error: "" }))
      .catch((e) => setState({ data: null, loading: false, error: e.message }));
  }, [url]);
  useEffect(load, [load]);
  return { ...state, reload: load };
}
