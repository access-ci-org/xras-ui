import { useRef } from "react";

import LoadingSpinner from "./LoadingSpinner";
import { useEffect } from "react";

export default function InfiniteScroll({
  children,
  hasMore,
  loadMore,
  isLoading,
}) {
  const bottom = useRef(null);
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
      observer.observe(bottom.current);
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
