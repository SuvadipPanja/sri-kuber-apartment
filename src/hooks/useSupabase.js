import { useState, useEffect, useCallback, useId } from 'react';
import { supabase } from '../services/supabase';

function channelName(prefix, id) {
  return `${prefix}-${String(id).replace(/:/g, '')}`;
}

/**
 * Generic hook to fetch from a Supabase table with real-time subscription
 */
export function useSupabaseTable(table, query = null) {
  const instanceId = useId();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let q = supabase.from(table).select('*');
      if (query) q = query(q);
      const { data: result, error: err } = await q;
      if (err) throw err;
      setData(result || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [table]);

  useEffect(() => {
    fetchData();
    // Real-time subscription
    const channel = supabase
      .channel(channelName(`realtime-${table}`, instanceId))
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        fetchData();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [table, fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Fetch single config row
 */
export function useConfig() {
  const instanceId = useId();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    const { data } = await supabase.from('config').select('*').eq('id', 1).single();
    setConfig(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConfig();
    const channel = supabase
      .channel(channelName('realtime-config', instanceId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'config' }, fetchConfig)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchConfig]);

  return { config, loading, refetch: fetchConfig };
}
