export default function SkeletonCard() {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div className="skeleton" style={{ width: 120, height: 22, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: 80, height: 18, borderRadius: 6 }} />
      </div>
      <div style={styles.teamsRow}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="skeleton" style={{ width: 120, height: 20, borderRadius: 6 }} />
          <div className="skeleton" style={{ width: 50, height: 14, borderRadius: 4 }} />
          <div className="skeleton" style={{ width: 60, height: 28, borderRadius: 6 }} />
        </div>
        <div className="skeleton" style={{ width: 24, height: 24, borderRadius: 6 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
          <div className="skeleton" style={{ width: 120, height: 20, borderRadius: 6 }} />
          <div className="skeleton" style={{ width: 50, height: 14, borderRadius: 4 }} />
          <div className="skeleton" style={{ width: 60, height: 28, borderRadius: 6 }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 5, borderRadius: 4 }} />
      <div style={styles.footer}>
        <div className="skeleton" style={{ width: 140, height: 14, borderRadius: 4 }} />
        <div className="skeleton" style={{ width: 90, height: 20, borderRadius: 6 }} />
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  teamsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    gap: '0.75rem',
    alignItems: 'center',
  },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
};
