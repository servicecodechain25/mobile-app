export default function Pager({ page, pageSize, total, onChange }) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
      <div style={{ fontSize: 14, color: '#666' }}>
        Showing {start}-{end} of {total}
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button
          className="icon-btn"
          title="Previous"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          style={{ background:'#fff', border:'1px solid #e5e7eb', color:'#374151', padding:8, borderRadius:8 }}
        >
          ‹
        </button>
        <span style={{ padding: '6px 10px', fontSize: 14, background:'#f3f4f6', border:'1px solid #e5e7eb', borderRadius:8, color:'#374151' }}>
          {page} / {totalPages}
        </span>
        <button
          className="icon-btn"
          title="Next"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          style={{ background:'#fff', border:'1px solid #e5e7eb', color:'#374151', padding:8, borderRadius:8 }}
        >
          ›
        </button>
      </div>
    </div>
  );
}
