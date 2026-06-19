import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * A wrapper component that performs navigation using the Document Transition API (if supported)
 * to provide smooth layout transitions between route redirects.
 */
const RedirectWithTransition = ({ to, replace = true }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof document.startViewTransition === "function") {
      const transition = document.startViewTransition(() => {
        navigate(to, { replace });
      });
      
      // Catch skip/abort rejections to prevent console error logs
      transition.ready.catch(() => {});
      transition.updateCallbackDone.catch(() => {});
      transition.finished.catch(() => {});
    } else {
      navigate(to, { replace });
    }
  }, [navigate, to, replace]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <span className="material-symbols-outlined animate-spin text-[48px] text-primary">sync</span>
    </div>
  );
};

export default RedirectWithTransition;
