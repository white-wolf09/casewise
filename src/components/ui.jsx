// Small shared building blocks used across pages
export const Card = ({ className = '', style, children }) => (
  <div className={`card ${className}`} style={style}>{children}</div>
);

export const CardHeader = ({ title, sub, action }) => (
  <div className="card-h">
    <div>
      <h3>{title}</h3>
      {sub && <div className="sm" style={{ marginTop: 4 }}>{sub}</div>}
    </div>
    {action}
  </div>
);

export const Tag = ({ tone = 'green', children }) => <span className={`tag tag-${tone}`}>{children}</span>;

export const Avatar = ({ ini, tone = 'blue' }) => <div className={`av av-${tone}`}>{ini}</div>;

export const Bar = ({ value }) => (
  <div className="bar"><i style={{ width: `${value}%` }} /></div>
);

export const Empty = ({ children }) => <div className="empty">{children}</div>;

export const Loading = () => <div className="empty">Loading…</div>;

export const STATUS_TONE = { Urgent: 'red', Active: 'green', Review: 'amber' };

// Show "You" for cases assigned to the signed-in user, otherwise the assignee's name
export const who = (name, user) => (name === user?.name ? 'You' : name);
