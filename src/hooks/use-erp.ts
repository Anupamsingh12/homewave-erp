import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Thin data-access hooks. Every screen talks to React Query, which talks to
 * the service layer — never directly to the repository. Swapping the mock
 * repository for a REST backend requires no change here.
 */
export function useData<T>(key: QueryKey, fn: () => Promise<T>, enabled = true) {
  return useQuery({ queryKey: key, queryFn: fn, enabled, staleTime: 10_000 });
}

export function useAction<TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>,
  options?: { success?: string; onDone?: (result: TResult) => void },
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (result) => {
      qc.invalidateQueries();
      if (options?.success) toast.success(options.success);
      options?.onDone?.(result);
    },
    onError: (error: Error) => toast.error(error.message || "Something went wrong"),
  });
}
