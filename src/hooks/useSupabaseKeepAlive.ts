// // Hook to keep Supabase session alive without UI refresh
// import { useEffect, useRef } from 'react';
// import { supabase } from '@/integrations/supabase/client';

// export function useSupabaseKeepAlive(intervalMs: number = 10 * 1000) {
//   const timerRef = useRef<NodeJS.Timeout | null>(null);

//   useEffect(() => {
//     const ping = async () => {
//       try {
//         console.log('[useSupabaseKeepAlive] ping supabase.auth.getSession...');
//         await supabase.auth.getSession();
//         console.log('[useSupabaseKeepAlive] ping done');
//       } catch (e) {
//         console.error('[useSupabaseKeepAlive] ping error:', e);
//       }
//     };
//     ping(); // Initial ping
//     timerRef.current = setInterval(ping, intervalMs) as unknown as NodeJS.Timeout;
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [intervalMs]);
// }
