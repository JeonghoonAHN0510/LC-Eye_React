import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import "../../../assets/css/projectListTable.css";

// ① 내부 훅을 파일 상단에 붙여넣기 (export 필요 없음)
function useColWidths({ rememberKey, columns, minColWidth = 30 }) {
  const initial = useMemo(
    () => columns.map(c => Math.max(minColWidth, c.width ?? 80)),
    [columns, minColWidth]
  );
  const fp = useMemo(
    () => columns.map(c => `${c.id}:${c.width ?? ""}`).join("|"),
    [columns]
  );
  const storageKey = useMemo(
    () => (rememberKey ? `${rememberKey}@v3` : null),
    [rememberKey]
  );
  const [widths, setWidths] = useState(initial);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) { setWidths(initial); return; }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) { setWidths(initial); return; }      // 레거시 무효화
      if (parsed && parsed.fp === fp &&
          Array.isArray(parsed.widths) &&
          parsed.widths.length === columns.length) {
        setWidths(parsed.widths);
      } else {
        setWidths(initial);
      }
    } catch {
      setWidths(initial);
    }
  }, [storageKey, fp, initial, columns.length]);

  const persist = useCallback((next) => {
    setWidths(next);
    if (!storageKey) return;
    try { localStorage.setItem(storageKey, JSON.stringify({ fp, widths: next })); } catch {}
  }, [storageKey, fp]);

  return { widths, setWidths, persist, initial };
}

export default function PorjectListTable({
  columns = [],                // [{ id, title, width? }]
  data = [],                   // [{ [id]: value }]
  minColWidth = 30,
  rememberKey,                 // 예: "PlaceInfo.columns"
  stickyFirst = true,
  sortable = true,
  resizeGrab = 10,              // 보더 감지 폭(px)
  showGuide = false,           // 드래그 가이드선 표시 여부(옵션)
  onRowClick
}) {
  // 초기 폭
  const initial = useMemo(
    () => columns.map(c => Math.max(minColWidth, c.width ?? 80)),
    [columns, minColWidth]
  );
  const [widths, setWidths] = useState(initial);

// 저장 복원 키를 컬럼 지문 포함으로
const storageKey = useMemo(
   () => rememberKey ? `${rememberKey}@v1:${columns.map(c => c.id).join('|')}` : null,
   [rememberKey, columns]
 );


  const [sort, setSort] = useState({ key: null, dir: "asc" });

  // 저장 복원
  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (Array.isArray(saved) && saved.length === columns.length) {
      setWidths(saved);
    }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const persist = (next) => {
    setWidths(next);
    if (!storageKey) return;
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
  };

  // 정렬
  const sorted = useMemo(() => {
    if (!sortable || !sort.key) return data;
    const dir = sort.dir === "desc" ? -1 : 1;
    const arr = [...data];
    arr.sort((a, b) => {
      const va = a[sort.key], vb = b[sort.key];
      const na = Number(va), nb = Number(vb);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return (na - nb) * dir;
      return String(va ?? "").localeCompare(String(vb ?? "")) * dir;
    });
    return arr;
  }, [data, sort, sortable]);

  // 보더 감지 & 드래그 상태
  const tableRef  = useRef(null);
  const scrollRef = useRef(null);        // 가이드선 기준 컨테이너
  const guideRef  = useRef(null);
  const dragRef   = useRef({ idx: null, startX: 0, startW: 0 });
  const rafIdRef  = useRef(null);        // rAF로 드래그 중 렌더 스로틀

  const nearRightEdge = (ev, el) => {
    const rect = el.getBoundingClientRect();
    const x = (ev.touches?.[0]?.clientX) ?? ev.clientX;
    return rect.right - x <= resizeGrab && rect.right - x >= -2;
  };
  const nearLeftEdge = (ev, el) => {
    const rect = el.getBoundingClientRect();
    const x = (ev.touches?.[0]?.clientX) ?? ev.clientX;
    return x - rect.left <= resizeGrab && x - rect.left >= -2;
  };

  // 커서: 보더 근처에서만 col-resize
  const onMouseMove = (e) => {
    const cell = e.target.closest("th,td");
    if (!cell) { tableRef.current.style.cursor = ""; return; }
    if (nearRightEdge(e, cell) || (cell.cellIndex > 0 && nearLeftEdge(e, cell))) {
      tableRef.current.style.cursor = "col-resize";
    } else {
      tableRef.current.style.cursor = "";
    }
  };

  // 드래그 시작
  const onPointerDown = (e) => {
    const cell = e.target.closest("th,td");
    if (!cell) return;

    const cellIdx = cell.cellIndex;

    // “그 보더의 왼쪽 열”만 타깃
    let targetIdx = null;
    if (nearRightEdge(e, cell)) {
      targetIdx = cellIdx;          // 우측 보더 → 현재 셀(왼쪽 열)
    } else if (cellIdx > 0 && nearLeftEdge(e, cell)) {
      targetIdx = cellIdx - 1;      // 좌측 보더 → 이전 셀(왼쪽 열)
    } else {
      // 보더가 아니면 헤더 클릭=정렬
      if (sortable && cell.tagName === "TH") {
        const id = columns[cellIdx]?.id;
        if (id) setSort(s => s.key !== id ? { key:id, dir:"asc" } : { key:id, dir: s.dir==="asc"?"desc":"asc" });
      }
      return;
    }

    e.preventDefault();

    // 가이드선(옵션)
    if (showGuide && !guideRef.current) {
      const guide = document.createElement("div");
      guide.className = "resize-guide";
      scrollRef.current.appendChild(guide);
      guideRef.current = guide;
    }
    if (showGuide) {
      const scrollRect = scrollRef.current.getBoundingClientRect();
      const startX = (e.touches?.[0]?.clientX) ?? e.clientX;
      guideRef.current.style.left = `${startX - scrollRect.left}px`;
      guideRef.current.style.display = "block";
    }

    dragRef.current = {
      idx: targetIdx,
      startX: (e.touches?.[0]?.clientX) ?? e.clientX,
      startW: widths[targetIdx],
    };

    const onMove = (ev) => {
      const doWork = () => {
        rafIdRef.current = null;
        const x  = (ev.touches?.[0]?.clientX) ?? ev.clientX;
        const dx = x - dragRef.current.startX;
        const w  = Math.max(minColWidth, Math.round(dragRef.current.startW + dx));

        // ★ 라이브 반영: 드래그 중에도 곧바로 열 폭 업데이트
        setWidths((prev) => {
          if (prev[dragRef.current.idx] === w) return prev;
          const next = prev.slice();
          next[dragRef.current.idx] = w;
          return next;
        });

        if (showGuide) {
          const scrollRect = scrollRef.current.getBoundingClientRect();
          guideRef.current.style.left = `${x - scrollRect.left}px`;
        }

        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
      };

      if (!rafIdRef.current) rafIdRef.current = requestAnimationFrame(doWork);
    };

    const onUp = (ev) => {
      // 최종 폭을 저장(로컬스토리지 포함)
      persist((curr => {
        const x  = (ev.touches?.[0]?.clientX) ?? ev.clientX;
        const dx = x - dragRef.current.startX;
        const w  = Math.max(minColWidth, Math.round(dragRef.current.startW + dx));
        const next = curr.slice();
        next[dragRef.current.idx] = w;
        return next;
      })(widths));

      if (showGuide) guideRef.current.style.display = "none";
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;

      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
      dragRef.current = { idx: null, startX: 0, startW: 0 };
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp, { once: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp, { once: true });
  };

  return (
    <div className="rzTable-wrap">
      <div className="rzTable-scroll" ref={scrollRef}>
        <table
          ref={tableRef}
          className={`rzTable ${stickyFirst ? "has-sticky-first" : ""}`}
          onMouseMove={onMouseMove}
          onMouseDown={onPointerDown}
          onTouchStart={onPointerDown}
        >
          <colgroup>
            {widths.map((w, i) => <col key={columns[i].id} style={{ width: `${w}px` }} />)}
          </colgroup>

          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={c.id} className={i===0 && stickyFirst ? "sticky-first" : ""}>
                  <div className="rz-th-inner">
                    <span className="rz-title">
                      {c.title}{sortable && sort.key===c.id && (sort.dir==="asc" ? " ▲" : " ▼")}
                    </span>
                    <span className="rz-border-visual" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 1 && sorted[0]?.__empty ? (
              <tr key="no-data">
                <td colSpan={columns.length}
                  style={{ textAlign: "center", color: "#666", padding: "20px 0" }}>
                  검색결과가 없습니다.
                </td>
              </tr>
            ) : (
              sorted.map((row, rIdx) => (
                <tr key={rIdx} 
                    className={row._active ? "active" : undefined} 
                    onClick={() => onRowClick?.(row)}
                >
                  {columns.map((c, i) => (
                    <td key={c.id} className={i === 0 && stickyFirst ? "sticky-first" : ""}>
                      {row[c.id]}
                      <span className="rz-border-visual" />
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
}
