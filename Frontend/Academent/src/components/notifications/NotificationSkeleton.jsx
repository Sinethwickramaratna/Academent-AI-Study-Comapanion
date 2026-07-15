import "./notification-ui.css";

function NotificationSkeleton({ count = 4 }) {
  return (
    <div className="notification-skeleton" aria-label="Loading notifications">
      {Array.from({ length: count }, (_, index) => <span key={index} />)}
    </div>
  );
}

export default NotificationSkeleton;

