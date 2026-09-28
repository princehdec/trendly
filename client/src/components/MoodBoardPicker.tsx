import { Check, FolderPlus, Layers3, LoaderCircle, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { api, type BoardMembership, type TrendItem } from "@/lib/api";

type MoodBoardPickerProps = {
  item: TrendItem;
  onClose: () => void;
  onChanged?: () => void;
};

export default function MoodBoardPicker({ item, onClose, onChanged }: MoodBoardPickerProps) {
  const [boards, setBoards] = useState<BoardMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    api.itemBoards(item.id).then(setBoards).finally(() => setLoading(false));
  }, [item.id]);

  const toggleBoard = async (board: BoardMembership) => {
    setBusyId(board.id);
    setBoards(current => current.map(entry => entry.id === board.id ? { ...entry, included: entry.included ? 0 : 1 } : entry));
    try {
      if (board.included) await api.removeFromMoodBoard(board.id, item.id);
      else await api.addToMoodBoard(board.id, item.id);
      onChanged?.();
    } catch {
      setBoards(current => current.map(entry => entry.id === board.id ? { ...entry, included: board.included } : entry));
    } finally {
      setBusyId(null);
    }
  };

  const createBoard = async (event: FormEvent) => {
    event.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const board = await api.createMoodBoard(newName.trim());
      await api.addToMoodBoard(board.id, item.id);
      setBoards(current => [{ id: board.id, name: board.name, included: 1 }, ...current]);
      setNewName("");
      onChanged?.();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="board-picker" role="dialog" aria-modal="true" aria-labelledby="board-picker-title">
        <div className="board-picker-head"><div><p className="eyebrow"><span className="eyebrow-line" />Organize your edit</p><h2 id="board-picker-title">Add to a mood board</h2><p className="picker-item-title">{item.title}</p></div><button type="button" className="close-button" aria-label="Close mood board picker" onClick={onClose}><X size={18} /></button></div>
        {loading ? <div className="picker-loading"><LoaderCircle className="spin" size={18} />Loading boards</div> : <div className="board-picker-list">{boards.length === 0 ? <div className="picker-empty"><Layers3 size={20} /><span>Create your first board below.</span></div> : boards.map(board => <button type="button" key={board.id} className={`board-option ${board.included ? "is-included" : ""}`} disabled={busyId === board.id} onClick={() => void toggleBoard(board)}><span className="board-option-icon"><Layers3 size={16} /></span><span>{board.name}</span><span className="board-check">{board.included ? <Check size={16} /> : null}</span></button>)}</div>}
        <form className="new-board-form" onSubmit={createBoard}><input value={newName} onChange={event => setNewName(event.target.value)} placeholder="New board name" aria-label="New mood board name" /><button type="submit" disabled={creating || !newName.trim()}><FolderPlus size={15} />{creating ? "Creating" : "Create"}</button></form>
      </section>
    </div>
  );
}
