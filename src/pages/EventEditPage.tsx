import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { getEvent } from "../mocks/eventStore";
import { getResponsesForEvent, updateResponse } from "../mocks/responseStore";
import { mockFamilies, mockChildren } from "../mocks/families";
import type { Event, Response, ChildResponse } from "../types";

function EventEditPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);

  useEffect(() => {
    if (id) {
      const e = getEvent(id);
      if (e) {
        setEvent(e);
        setResponses(getResponsesForEvent(id));
      }
    }
  }, [id]);

  if (!event) return <div className="app-shell">イベントが見つかりません</div>;

  function handleFamilyUpdate(familyId: string, updater: (r: Response) => Response) {
    setResponses((prev) =>
      prev.map((r) => {
        if (r.familyId === familyId) {
          const updated = updater(r);
          updated.status = "回答済み"; // Auto status update
          if (id) updateResponse(id, updated);
          return updated;
        }
        return r;
      })
    );
  }

  function handleChildUpdate(familyId: string, childId: string, updater: (cr: ChildResponse) => ChildResponse) {
    handleFamilyUpdate(familyId, (r) => {
      return {
        ...r,
        children: r.children.map((cr) => (cr.childId === childId ? updater(cr) : cr)),
      };
    });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">{event.date} {event.destinationName}</p>
          <h1>{event.name}</h1>
        </div>
        <Link className="primary-button" to={`/events/${id}/carpool`}>
          自動配車へ →
        </Link>
      </header>

      <section className="panel">
        <Link to="/" className="back-link">← イベント一覧</Link>

        <div className="family-list">
          {responses.map((response) => {
            const family = mockFamilies.find(f => f.id === response.familyId);
            if (!family) return null;

            return (
              <div key={family.id} className="family-card">
                <div className="family-header">
                  <div className="family-name">
                    <h3>{family.name}家</h3>
                    <button 
                      className={`status-badge ${response.status === "未回答" ? "status-unanswered" : "status-answered"}`}
                      onClick={() => handleFamilyUpdate(family.id, r => ({ ...r, status: r.status === "未回答" ? "回答済み" : "未回答" }))}
                    >
                      {response.status}
                    </button>
                  </div>

                  <div className="family-toggles">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={response.driverOutward}
                        onChange={(e) => handleFamilyUpdate(family.id, r => ({ ...r, driverOutward: e.target.checked }))}
                      />
                      車出し(行き)
                    </label>
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={response.driverReturn}
                        onChange={(e) => handleFamilyUpdate(family.id, r => ({ ...r, driverReturn: e.target.checked }))}
                      />
                      車出し(帰り)
                    </label>
                    
                    <div className="capacity-input-group">
                      <label>乗車可能人数</label>
                      <input 
                        type="number" 
                        min="0"
                        placeholder={String(family.vehicleCapacity)}
                        value={response.capacityToday === null ? "" : response.capacityToday}
                        onChange={(e) => {
                          const val = e.target.value === "" ? null : parseInt(e.target.value, 10);
                          handleFamilyUpdate(family.id, r => ({ ...r, capacityToday: val }));
                        }}
                        className={response.capacityToday !== null ? "edited-capacity" : "default-capacity"}
                      />
                      {response.capacityToday !== null && <span className="edited-icon">⚠️</span>}
                    </div>
                  </div>
                </div>

                <div className="child-list">
                  {response.children.map((childResponse) => {
                    const child = mockChildren.find(c => c.id === childResponse.childId);
                    if (!child) return null;

                    return (
                      <div key={child.id} className="child-row">
                        <div className="child-info">
                          <strong>{child.name}</strong> <span className="child-grade">({child.grade})</span>
                        </div>
                        <div className="child-toggles">
                          <label className="checkbox-label">
                            <input 
                              type="checkbox" 
                              checked={childResponse.isParticipating}
                              onChange={(e) => handleChildUpdate(family.id, child.id, cr => ({ ...cr, isParticipating: e.target.checked }))}
                            />
                            参加
                          </label>
                          <label className="checkbox-label">
                            <input 
                              type="checkbox" 
                              checked={childResponse.noOutwardRide}
                              onChange={(e) => handleChildUpdate(family.id, child.id, cr => ({ ...cr, noOutwardRide: e.target.checked }))}
                            />
                            行きの配車不要
                          </label>
                          <label className="checkbox-label">
                            <input 
                              type="checkbox" 
                              checked={childResponse.noReturnRide}
                              onChange={(e) => handleChildUpdate(family.id, child.id, cr => ({ ...cr, noReturnRide: e.target.checked }))}
                            />
                            帰りの配車不要
                          </label>
                        </div>
                        <input 
                          type="text" 
                          placeholder="備考 (自由入力)" 
                          value={childResponse.remarks}
                          onChange={(e) => handleChildUpdate(family.id, child.id, cr => ({ ...cr, remarks: e.target.value }))}
                          className="child-remarks"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default EventEditPage;
