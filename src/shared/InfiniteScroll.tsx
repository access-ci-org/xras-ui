import { useEffect, useRef } from "react";
import LoadingSpinner from "./LoadingSpinner";

export default function InfiniteScroll({
  children,
  hasMore,
  loadMore,
  isLoading,
}: {
  children: React.ReactNode;
  hasMore: boolean;
  loadMore: () => void;
  isLoading: boolean;
}) {
  const bottom = useRef<HTMLDivElement>(null);
  const loading = useRef(isLoading);

  useEffect(() => {
    loading.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    const trigger = bottom.current;
    if (trigger && hasMore) {
      const observer = new IntersectionObserver((e) => {
        if (!loading.current && e[0].isIntersecting) loadMore();
      });
      observer.observe(trigger);
      return () => observer.unobserve(trigger);
    }
  }, [bottom, loadMore, hasMore]);

  return (
    <>
      {children}
      <div ref={bottom}></div>
      {isLoading && <LoadingSpinner />}
    </>
  );
}
