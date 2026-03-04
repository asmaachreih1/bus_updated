export const styles = `
  .admin-shell {
    --ink: #e7f3fc;
    --muted: #9eb7ca;
    --line: #365269;
    --panel: rgba(16, 35, 52, 0.87);
    --panel-strong: rgba(10, 24, 37, 0.94);
    --accent: #f2b54a;
    --accent-secondary: #39c4bf;
    --ok: #4fcb96;
    --warning: #f2a64f;
    --danger: #ea6a67;
    position: relative;
    min-height: 100vh;
    padding: 1.25rem;
    color: var(--ink);
    overflow-y: auto;
    font-family: "Rajdhani", "Franklin Gothic Medium", "Trebuchet MS", sans-serif;
    background:
      radial-gradient(circle at 15% -8%, rgba(57, 196, 191, 0.24), transparent 42%),
      radial-gradient(circle at 98% 1%, rgba(242, 181, 74, 0.2), transparent 34%),
      linear-gradient(155deg, #06121d 0%, #0b2031 52%, #07131e 100%);
  }

  .road-grid {
    position: absolute;
    top: -12%;
    left: 50%;
    transform: translateX(-50%) rotate(6deg);
    width: 240px;
    height: 130%;
    border-radius: 999px;
    border: 1px solid rgba(97, 134, 159, 0.28);
    background: linear-gradient(180deg, rgba(18, 38, 56, 0.46), rgba(7, 17, 27, 0.2));
    pointer-events: none;
    opacity: 0.58;
    overflow: hidden;
  }

  .road-grid::before {
    content: "";
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 9px;
    height: 140%;
    background: repeating-linear-gradient(
      to bottom,
      rgba(242, 181, 74, 0.9) 0 44px,
      transparent 44px 100px
    );
    opacity: 0.84;
    animation: lane-flow 3s linear infinite;
  }

  .admin-bg-shape {
    position: absolute;
    z-index: 0;
    border-radius: 999px;
    filter: blur(40px);
    opacity: 0.35;
    pointer-events: none;
  }

  .admin-bg-shape-one {
    width: 380px;
    height: 380px;
    background: #2dc4c8;
    top: -120px;
    right: -120px;
  }

  .admin-bg-shape-two {
    width: 280px;
    height: 280px;
    background: #f2b54a;
    left: -100px;
    bottom: -120px;
  }

  .admin-header,
  .stats-grid,
  .admin-grid,
  .panel,
  .message-banner {
    position: relative;
    z-index: 1;
  }

  .admin-header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    margin: 0 auto 1.25rem auto;
    max-width: 1260px;
  }

  .eyebrow {
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--accent);
  }

  h1 {
    margin: 0.25rem 0 0.35rem 0;
    font-size: clamp(1.8rem, 4vw, 2.6rem);
    line-height: 1.05;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .subtitle {
    margin: 0;
    max-width: 620px;
    color: #b6ccdb;
  }

  .chip-row {
    margin-top: 0.75rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    border: 1px solid rgba(104, 140, 162, 0.46);
    border-radius: 999px;
    background: rgba(8, 19, 30, 0.6);
    padding: 0.25rem 0.62rem;
    color: #c4d9e7;
    font-size: 0.76rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .header-metrics {
    min-width: min(340px, 100%);
    display: grid;
    gap: 0.45rem;
    align-content: start;
  }

  .metric-chip {
    border: 1px solid rgba(100, 137, 160, 0.44);
    border-radius: 12px;
    background: rgba(6, 18, 28, 0.64);
    padding: 0.5rem 0.65rem;
    display: grid;
    gap: 0.2rem;
  }

  .metric-chip span {
    color: var(--muted);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.14em;
  }

  .metric-chip strong {
    color: #edf6fc;
    font-size: 1.45rem;
    line-height: 1;
  }

  h2 {
    margin: 0 0 0.75rem 0;
    font-size: 1.1rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .stats-grid {
    max-width: 1260px;
    margin: 0 auto 1rem auto;
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .stat-card {
    background: linear-gradient(160deg, var(--panel), var(--panel-strong));
    border: 1px solid rgba(96, 131, 153, 0.42);
    border-left: 3px solid var(--accent-secondary);
    border-radius: 14px;
    padding: 0.9rem 1rem;
    box-shadow: 0 14px 30px rgba(3, 12, 19, 0.4);
  }

  .stat-card:nth-child(2) {
    border-left-color: var(--accent);
  }

  .stat-card:nth-child(3) {
    border-left-color: var(--danger);
  }

  .stat-card:nth-child(4) {
    border-left-color: var(--ok);
  }

  .stat-card p {
    margin: 0;
    font-size: 0.7rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.11em;
  }

  .stat-card strong {
    display: block;
    margin-top: 0.24rem;
    font-size: 1.65rem;
    color: #f2f9ff;
  }

  .stat-card span {
    display: block;
    margin-top: 0.22rem;
    font-size: 0.75rem;
    color: #adc3d1;
  }

  .message-banner {
    max-width: 1260px;
    margin: 0 auto 0.9rem auto;
    padding: 0.75rem 0.95rem;
    background: linear-gradient(120deg, rgba(41, 118, 159, 0.42), rgba(16, 48, 67, 0.72));
    border: 1px solid rgba(88, 143, 172, 0.62);
    border-radius: 12px;
    color: #e9f5ff;
  }

  .admin-grid {
    max-width: 1260px;
    margin: 0 auto 1rem auto;
    display: grid;
    gap: 0.8rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .panel {
    max-width: 1260px;
    margin: 0 auto 1rem auto;
    background: linear-gradient(160deg, var(--panel), var(--panel-strong));
    border-radius: 16px;
    border: 1px solid rgba(96, 131, 153, 0.4);
    box-shadow: 0 15px 36px rgba(3, 12, 19, 0.4);
    padding: 1rem;
    backdrop-filter: blur(10px);
  }

  .panel-head {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .form-grid {
    display: grid;
    gap: 0.8rem;
  }

  label {
    font-size: 0.76rem;
    color: #adc2d1;
    display: grid;
    gap: 0.35rem;
    text-transform: uppercase;
    letter-spacing: 0.09em;
  }

  input,
  select {
    border: 1px solid rgba(108, 145, 168, 0.44);
    border-radius: 10px;
    padding: 0.55rem 0.65rem;
    background: rgba(8, 20, 30, 0.65);
    color: #e7f3fb;
    font-family: inherit;
  }

  input::placeholder {
    color: #7894a7;
  }

  .list {
    display: grid;
    gap: 0.65rem;
  }

  .list-item {
    border: 1px solid rgba(102, 140, 163, 0.42);
    border-radius: 12px;
    background: rgba(8, 22, 34, 0.66);
    padding: 0.7rem;
    display: flex;
    gap: 0.7rem;
    justify-content: space-between;
    align-items: flex-start;
  }

  .list-item h3 {
    margin: 0 0 0.3rem 0;
    font-size: 0.95rem;
  }

  .list-item h3 span {
    font-size: 0.72rem;
    color: #8eb1c8;
    margin-left: 0.35rem;
    font-weight: 600;
  }

  .list-item p {
    margin: 0.2rem 0;
    font-size: 0.83rem;
    color: #c0d6e4;
  }

  .muted {
    color: #8ea8bb;
    font-size: 0.76rem;
  }

  .meta-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin-top: 0.2rem;
    font-size: 0.75rem;
    color: #bdd1de;
  }

  .stars {
    color: var(--accent);
    letter-spacing: 0.06em;
    font-size: 0.82rem;
  }

  .status-pill {
    border-radius: 999px;
    padding: 0.15rem 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.62rem;
    border: 1px solid rgba(125, 161, 182, 0.48);
    color: #d4e7f3;
    background: rgba(16, 36, 52, 0.68);
  }

  .driver-available {
    border-color: rgba(79, 203, 150, 0.74);
    color: #9de9c3;
  }

  .driver-on-duty {
    border-color: rgba(57, 196, 191, 0.75);
    color: #9be5e2;
  }

  .driver-off-duty {
    border-color: rgba(149, 169, 183, 0.68);
    color: #becfdb;
  }

  .feedback-new {
    border-color: rgba(242, 166, 79, 0.82);
    color: #ffd59c;
  }

  .feedback-reviewed {
    border-color: rgba(86, 169, 227, 0.76);
    color: #bae4ff;
  }

  .feedback-actioned {
    border-color: rgba(79, 203, 150, 0.74);
    color: #a6ecc8;
  }

  .severity-low {
    border-color: rgba(91, 204, 141, 0.76);
    color: #abedc3;
  }

  .severity-medium {
    border-color: rgba(242, 181, 74, 0.84);
    color: #ffdea4;
  }

  .severity-high {
    border-color: rgba(234, 106, 103, 0.84);
    color: #ffc2bd;
  }

  .incident-open {
    border-color: rgba(234, 106, 103, 0.84);
    color: #ffbfba;
  }

  .incident-in-progress {
    border-color: rgba(242, 181, 74, 0.84);
    color: #ffe1ad;
  }

  .incident-resolved {
    border-color: rgba(79, 203, 150, 0.78);
    color: #a5ebc6;
  }

  .button-row {
    display: grid;
    gap: 0.35rem;
    min-width: 108px;
  }

  button {
    cursor: pointer;
    border: 1px solid rgba(112, 148, 170, 0.56);
    border-radius: 10px;
    padding: 0.45rem 0.6rem;
    background: rgba(10, 26, 40, 0.7);
    color: #dbf0ff;
    font-size: 0.74rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    transition: transform 0.16s ease, border-color 0.16s ease;
  }

  button:hover {
    transform: translateY(-1px);
    border-color: rgba(158, 199, 224, 0.82);
  }

  .primary-btn {
    border: 1px solid rgba(242, 181, 74, 0.82);
    background: linear-gradient(120deg, rgba(242, 181, 74, 0.95), rgba(226, 143, 47, 0.92));
    color: #1d1307;
    font-weight: 700;
  }

  .ghost-btn {
    border: 1px solid rgba(112, 148, 170, 0.56);
    background: rgba(6, 18, 28, 0.82);
    color: #d8e9f5;
    min-width: 150px;
  }

  .mini-btn-ready {
    border-color: rgba(79, 203, 150, 0.74);
    color: #9fe8c2;
  }

  .mini-btn-route {
    border-color: rgba(57, 196, 191, 0.76);
    color: #9ae4e1;
  }

  .mini-btn-off {
    border-color: rgba(149, 169, 183, 0.68);
    color: #bfd0dc;
  }

  .activity-list {
    display: grid;
    gap: 0.45rem;
  }

  .activity-item {
    border: 1px dashed rgba(100, 137, 159, 0.54);
    border-radius: 10px;
    padding: 0.55rem 0.65rem;
    display: flex;
    gap: 0.6rem;
    align-items: center;
    background: rgba(8, 21, 33, 0.7);
  }

  .activity-item p {
    margin: 0;
    font-size: 0.85rem;
    color: #cce0ec;
    flex: 1;
  }

  .activity-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--accent);
    box-shadow: 0 0 0 4px rgba(242, 181, 74, 0.18);
    flex-shrink: 0;
  }

  .activity-time {
    font-size: 0.77rem;
    color: #90a8bb;
    white-space: nowrap;
  }

  .panel-headline {
    display: grid;
    gap: 0.2rem;
  }

  @keyframes lane-flow {
    from {
      transform: translate(-50%, -6%);
    }
    to {
      transform: translate(-50%, 6%);
    }
  }

  @media (max-width: 1060px) {
    .admin-grid {
      grid-template-columns: 1fr;
    }

    .admin-header {
      flex-direction: column;
    }

    .header-metrics {
      width: 100%;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .header-metrics .ghost-btn {
      grid-column: 1 / -1;
    }

    .stats-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .admin-shell {
      padding: 0.9rem;
    }

    .road-grid {
      display: none;
    }

    .panel-head {
      flex-direction: column;
      align-items: stretch;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .header-metrics {
      grid-template-columns: 1fr;
    }

    .list-item {
      flex-direction: column;
    }

    .button-row {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      min-width: 0;
      width: 100%;
    }
  }
`;
