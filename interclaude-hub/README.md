# interclaude-hub

Cloudflare Worker, który zamienia webhooki z zespołu InterClaude w Linear na zdarzenia push dla sesji Claude Code (plugin `interclaude`). Linear sam nikogo nie budzi; hub to robi.

## Endpointy

| Endpoint | Co robi |
|---|---|
| `POST /linear/webhook` | Webhook Linear. Sprawdza `Linear-Signature` (HMAC-SHA256 surowego body) i świeżość `webhookTimestamp`, odrzuca duplikaty `Linear-Delivery`, przyjmuje tylko zespół `LINEAR_TEAM_ID`. |
| `GET /login?port=&state=` | Start logowania pluginu: przekierowuje do Linear OAuth (scope `read`). Bez sekretów OAuth pokazuje komunikat po polsku. |
| `GET /oauth/callback` | Wymienia kod, czyta `viewer` (id, imię), od razu unieważnia token Linear, wydaje token huba i przekierowuje na `http://127.0.0.1:<port>/callback`. |
| `GET /ws` | WebSocket z `Authorization: Bearer <token huba>` do Durable Object danej osoby. |
| `GET /inbox`, `POST /inbox/ack` | Zaległe zdarzenia i ich potwierdzanie. |
| `GET /me` | Sprawdzenie tokenu. |
| `GET /health` | Stan i to, co jest skonfigurowane (bez wartości sekretów). |
| `GET /debug/recent` | Ostatnie decyzje routingu i surowe payloady; tylko z `Authorization: Bearer <DEBUG_TOKEN>`. |

## Routing

| Zdarzenie w Linear | Do kogo | `kind` |
|---|---|---|
| zadanie przesunięte na Zatwierdzone (albo przepisane na kogoś, gdy jest w Zatwierdzone) | przypisana osoba | `task_approved` |
| to samo z etykietą `interclaude-slack` | Slack #agents z @Claude (jeśli jest `SLACK_BOT_TOKEN`) | |
| komentarz kogoś innego niż przypisana osoba | przypisana osoba | `comment` |
| komentarz przypisanej osoby | autor zadania (zlecający) | `comment` |
| przesunięcie na Do sprawdzenia | autor zadania | `task_ready_for_review` |
| przesunięcie na Gotowe albo Odrzucone | przypisana osoba | `task_closed` |

Komentarz nie trafia do autora komentarza. Zdarzenia dla `SHARED_CLAUDE_LINEAR_USER_ID` (konto Linear używane przez wspólnego Claude na Slacku) idą na Slack zamiast do WebSocketu. Zespół i etykieta są rozpoznawane po id, więc zmiana nazw w Linear nic nie psuje.

Każda osoba ma swój Durable Object (SQLite): hashe tokenów, połączenia WebSocket (hibernation API) i kolejkę niepotwierdzonych zdarzeń (maks. 200, 7 dni). Zdarzenie idzie tylko do najnowszego połączenia tej osoby.

## Konfiguracja

Zmienne jawne są w `wrangler.jsonc`. Sekrety (`wrangler secret put` albo panel Cloudflare, Workers > interclaude-hub > Settings > Variables and Secrets):

| Sekret | Wymagany | Po co |
|---|---|---|
| `LINEAR_WEBHOOK_SECRET` | tak | podpis webhooków Linear |
| `LINEAR_OAUTH_CLIENT_ID`, `LINEAR_OAUTH_CLIENT_SECRET` | do logowania | aplikacja OAuth "InterClaude" w Linear |
| `SLACK_BOT_TOKEN` | nie | wpisy na #agents dla zadań `interclaude-slack` |
| `LINEAR_API_KEY` | nie | dociąga zadanie, gdy komentarz dotyczy zadania, którego hub jeszcze nie widział |
| `DEBUG_TOKEN` | nie | włącza `/debug/recent` |

Opcjonalna zmienna: `SHARED_CLAUDE_LINEAR_USER_ID`.

## Wdrożenie

```bash
bun install
bun run test && bun run typecheck
LINEAR_API_KEY=... ./scripts/setup.sh   # deploy + LINEAR_WEBHOOK_SECRET + webhook w Linear
```
