import { useMemo, useState } from "react";

import type { PlayerId, PlayerState, PrivateId, PrivateState } from "../engine/model";
import { useGameStore } from "../store/gameStore";
import { useColors } from "../styles/colors";

export interface PrivateTradeDialogProps {
  onClose: () => void;
}

type ActorRole = "seller" | "buyer";

function PrivateTradeDialog({ onClose }: PrivateTradeDialogProps) {
  const game = useGameStore((s) => s.game);
  const dispatch = useGameStore((s) => s.dispatch);
  const colors = useColors();
  const fieldStyle = {
    width: "100%",
    padding: "6px 8px",
    background: "var(--bg-card-alt, var(--bg-card))",
    color: "var(--text-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: 4,
  } as const;

  const [role, setRole] = useState<ActorRole>("seller");
  const [privateId, setPrivateId] = useState<PrivateId | "">("");
  const [counterpartyId, setCounterpartyId] = useState<PlayerId | "">("");
  const [priceInput, setPriceInput] = useState<string>("");

  const currentActorId: PlayerId | null =
    game && game.round === "stock" && game.stock ? game.stock.currentActorId : null;

  const availablePrivates = useMemo<PrivateState[]>(() => {
    if (!game || !currentActorId) return [];
    const ownerId = role === "seller" ? currentActorId : counterpartyId;
    if (!ownerId) return [];
    return Object.values(game.privates).filter(
      (privateCompany) =>
        privateCompany.location.type === "player"
        && privateCompany.location.playerId === ownerId,
    );
  }, [game, currentActorId, role, counterpartyId]);

  const otherPlayers = useMemo<PlayerState[]>(() => {
    if (!game || !currentActorId) return [];
    return game.playerOrder
      .filter((playerId) => playerId !== currentActorId)
      .map((playerId) => game.players[playerId])
      .filter((player): player is PlayerState => Boolean(player));
  }, [game, currentActorId]);

  if (!game || game.round !== "stock" || !game.stock) {
    return null;
  }
  const stock = game.stock;
  const pending = stock.pendingPrivateTrade ?? null;

  if (pending) {
    const privateCompany = game.privates[pending.privateId];
    const buyerName = game.players[pending.buyerId]?.name ?? pending.buyerId;
    const sellerName = game.players[pending.sellerId]?.name ?? pending.sellerId;
    const responderName =
      game.players[pending.responderId]?.name ?? pending.responderId;
    const respond = (accepted: boolean) => {
      dispatch({
        id: crypto.randomUUID(),
        gameId: game.id,
        actorId: pending.responderId,
        expectedVersion: game.version,
        type: "stock.respondPrivateTrade",
        payload: { accepted },
      });
      onClose();
    };

    return (
      <div
        style={{
          padding: 16,
          border: "1px solid var(--border-color)",
          borderRadius: 8,
          background: "var(--bg-card)",
          color: "var(--text-primary)",
          maxWidth: 480,
        }}
      >
        <h3 style={{ fontWeight: 600, marginBottom: 12 }}>
          Pending Private-Company Trade
        </h3>
        <div style={{ marginBottom: 12, lineHeight: 1.5 }}>
          <div>
            <strong>Private:</strong>{" "}
            {privateCompany
              ? `${privateCompany.name} (face $${privateCompany.faceValue})`
              : pending.privateId}
          </div>
          <div>
            <strong>Seller:</strong> {sellerName}
          </div>
          <div>
            <strong>Buyer:</strong> {buyerName}
          </div>
          <div>
            <strong>Price:</strong> ${pending.price}
          </div>
        </div>
        <div style={{ marginBottom: 8, fontStyle: "italic", fontSize: "0.9em" }}>
          {responderName}, confirm or reject this trade.
        </div>
        <div className="ui-actions">
          <button
            type="button"
            onClick={() => respond(true)}
            className={`rounded px-3 py-2 ${colors.button.success}`}
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => respond(false)}
            className={`rounded px-3 py-2 ${colors.button.danger}`}
          >
            Reject
          </button>
        </div>
      </div>
    );
  }

  const parsedPrice = Number.parseInt(priceInput, 10);
  const priceValid = Number.isInteger(parsedPrice) && parsedPrice >= 0;
  const canSubmit = Boolean(privateId) && Boolean(counterpartyId) && priceValid;

  const submit = () => {
    if (!canSubmit || !privateId || !counterpartyId) return;
    const buyerId: PlayerId =
      role === "seller" ? counterpartyId : stock.currentActorId;
    const sellerId: PlayerId =
      role === "seller" ? stock.currentActorId : counterpartyId;

    const result = dispatch({
      id: crypto.randomUUID(),
      gameId: game.id,
      actorId: stock.currentActorId,
      expectedVersion: game.version,
      type: "stock.proposePrivateTrade",
      payload: { privateId, buyerId, sellerId, price: parsedPrice },
    });
    if (result.ok) {
      onClose();
    }
  };

  const counterpartyLabel = role === "seller" ? "Buyer" : "Seller";

  return (
    <div
      style={{
        padding: 16,
        border: "1px solid var(--border-color)",
        borderRadius: 8,
        background: "var(--bg-card)",
        color: "var(--text-primary)",
        maxWidth: 480,
      }}
    >
      <h3 style={{ fontWeight: 600, marginBottom: 12 }}>
        Propose Private-Company Trade
      </h3>

      <div className="ui-actions" style={{ marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => {
            setRole("seller");
            setPrivateId("");
            setCounterpartyId("");
          }}
          className={`rounded px-3 py-2 ${role === "seller" ? colors.button.primary : colors.button.secondary}`}
        >
          I&apos;m selling
        </button>
        <button
          type="button"
          onClick={() => {
            setRole("buyer");
            setPrivateId("");
            setCounterpartyId("");
          }}
          className={`rounded px-3 py-2 ${role === "buyer" ? colors.button.primary : colors.button.secondary}`}
        >
          I&apos;m buying
        </button>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ display: "block", fontSize: "0.9em", marginBottom: 4 }}>
          Private
        </label>
        <select
          value={privateId}
          onChange={(event) => setPrivateId(event.target.value)}
          style={fieldStyle}
        >
          <option value="">Select a private</option>
          {availablePrivates.map((privateCompany) => (
            <option key={privateCompany.id} value={privateCompany.id}>
              {privateCompany.name} (face ${privateCompany.faceValue})
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ display: "block", fontSize: "0.9em", marginBottom: 4 }}>
          {counterpartyLabel}
        </label>
        <select
          value={counterpartyId}
          onChange={(event) => {
            setCounterpartyId(event.target.value);
            if (role === "buyer") setPrivateId("");
          }}
          style={fieldStyle}
        >
          <option value="">Select a player</option>
          {otherPlayers.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: "0.9em", marginBottom: 4 }}>
          Price ($)
        </label>
        <input
          type="number"
          min={0}
          step={1}
          value={priceInput}
          onChange={(event) => setPriceInput(event.target.value)}
          style={fieldStyle}
        />
      </div>

      <div className="ui-actions">
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className={`rounded px-3 py-2 ${canSubmit ? colors.button.primary : colors.button.disabled}`}
        >
          Propose
        </button>
        <button
          type="button"
          onClick={onClose}
          className={`rounded px-3 py-2 ${colors.button.secondary}`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default PrivateTradeDialog;
export { PrivateTradeDialog };
