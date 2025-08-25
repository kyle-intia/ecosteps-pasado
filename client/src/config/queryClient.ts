import { QueryClient, QueryClientConfig } from "@tanstack/react-query";

const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
};

const queryClient = new QueryClient(queryClientConfig);

export default queryClient;
