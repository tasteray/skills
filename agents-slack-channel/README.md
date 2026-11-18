# agents-slack-channel

Plugin Claude Code typu **channel** (research preview), który łączy kanał Slack `#agents` z Twoją działającą sesją Claude Code.

Gdy ktoś z zespołu albo agent innej osoby napisze w `#agents` wiadomość zaadresowaną do Twojego agenta, plugin od razu wstrzykuje ją do Twojej otwartej sesji. Sesja się budzi, robi swoje i odpowiada w tym samym wątku jako Twoja własna aplikacja Slack, np. `Claude (Goo)`, a nie jako Ty.

## Jak to działa

- Plugin to lokalny serwer MCP, który Claude Code uruchamia razem z sesją. Łączy się ze Slackiem przez **Socket Mode**, więc nie potrzeba publicznego adresu URL.
- Słucha tylko kanałów z `ALLOWED_CHANNEL_IDS` (domyślnie `#agents`, `C0CJECFD8QP`), zarówno wiadomości głównych, jak i odpowiedzi w wątkach.
- Do sesji trafia wiadomość tylko wtedy, gdy:
  1. nadawca jest na liście `ALLOWED_SENDER_IDS`,
  2. wiadomość jest zaadresowana do Ciebie: zawiera `[do: Claude (<AGENT_NAME>)]` (wielkość liter bez znaczenia) albo @-wzmiankę Twojej aplikacji.
- Wszystko inne jest po cichu pomijane. To ochrona przed prompt injection: obcy człowiek ani obcy bot nie wstrzykną tekstu do Twojej sesji. Wiadomości wysłane przez Twoją własną aplikację też są pomijane.
- Sesja dostaje narzędzie `reply`, które publikuje odpowiedź w wątku jako Twoja aplikacja i samo dokleja protokół (patrz niżej).

## Dlaczego każda osoba potrzebuje własnej aplikacji Slack

Socket Mode nie wysyła każdego zdarzenia do wszystkich połączeń jednej aplikacji. Jedna aplikacja może mieć do 10 otwartych połączeń, a Slack rozkłada zdarzenia między nie, więc każde zdarzenie dostaje tylko jedno z nich. Gdyby kilka osób używało jednej aplikacji, każda sesja widziałaby tylko część wiadomości.

Dlatego: **jedna osoba = jedna aplikacja Slack = jedna działająca sesja z tym kanałem**. Nie uruchamiaj też dwóch sesji z tym samym tokenem naraz, bo wiadomości rozdzielą się między nie.

> Oficjalne potwierdzenie w dokumentacji Slacka (sekcja o wielu połączeniach na stronie Socket Mode) jest jeszcze do sprawdzenia: przy tworzeniu pluginu strony api.slack.com i docs.slack.dev były niedostępne, a powyższe opiera się na źródłach pośrednich. Projekt i tak zakłada najbezpieczniejszy wariant, czyli osobną aplikację na osobę.

## Wymagania

- Claude Code zalogowany kontem claude.ai w organizacji TasteRay (Team lub Enterprise) albo kluczem z Console.
- [Bun](https://bun.sh) (`bun --version`). Plugin sam instaluje swoje zależności przy starcie.
- Owner organizacji włączył Channels (Organization settings > Claude Code > Channels). To już jest zrobione.
- Komputer i sesja Claude Code muszą być włączone. Wiadomości docierają tylko do otwartej sesji.

## Konfiguracja dla każdej osoby

### 1. Utwórz aplikację Slack z manifestu

1. Otwórz https://api.slack.com/apps i wybierz **Create New App** > **From a manifest**, workspace TasteRay.
2. Wklej zawartość [`slack-app-manifest.yaml`](./slack-app-manifest.yaml) i zamień `Imie` na swoje imię, np. `Claude (Goo)`. Ta nazwa będzie widoczna przy postach agenta.
3. Zakresy są minimalne: `channels:history`, `chat:write`, `users:read`, zdarzenie `message.channels`, Socket Mode włączony.

### 2. Wygeneruj tokeny

1. **Basic Information** > **App-Level Tokens** > **Generate Token and Scopes**, zakres `connections:write`. To jest `SLACK_APP_TOKEN` (zaczyna się od `xapp-`).
2. **Install App** > **Install to Workspace**. Skopiuj **Bot User OAuth Token**. To jest `SLACK_BOT_TOKEN` (zaczyna się od `xoxb-`).

### 3. Dodaj aplikację do kanału

W `#agents` wpisz `/invite @Claude (Twoje imię)`. Bez tego aplikacja nie dostaje wiadomości z kanału.

### 4. Zbierz identyfikatory nadawców

`ALLOWED_SENDER_IDS` to lista identyfikatorów oddzielonych przecinkami:

- Slack user id każdej osoby z zespołu, która może pisać do Twojego agenta (profil > trzy kropki > **Copy member ID**, np. `U06AJEYTJ4Q`).
- Bot user id aplikacji agentów innych osób (otwórz profil aplikacji, np. `Claude (Ola)`, w Slacku > **Copy member ID**). Można też podać bot id zaczynające się od `B`.

Swojej własnej aplikacji nie musisz dodawać.

### 5. Zapisz konfigurację lokalnie

Utwórz plik `~/.claude/channels/agents-slack-channel/.env` i ustaw mu prawa tylko dla siebie:

```bash
mkdir -p ~/.claude/channels/agents-slack-channel
touch ~/.claude/channels/agents-slack-channel/.env
chmod 600 ~/.claude/channels/agents-slack-channel/.env
```

Zawartość:

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
AGENT_NAME=Goo
ALLOWED_CHANNEL_IDS=C0CJECFD8QP
ALLOWED_SENDER_IDS=U06AJEYTJ4Q,U0XXXXXXX,U0YYYYYYY
MAX_AGENT_TURNS=6
RATE_LIMIT_PER_MINUTE=5
```

Zamiast pliku możesz ustawić te same zmienne w środowisku powłoki albo w swoim menedżerze sekretów. Zmienne środowiska mają pierwszeństwo przed plikiem. Inną ścieżkę pliku wskażesz przez `AGENTS_SLACK_ENV_FILE`.

**Nigdy nie wklejaj tokenów na Slacku, w wątkach, w issue ani w repozytorium.** Jeśli token wycieknie, unieważnij go w ustawieniach aplikacji i wygeneruj nowy.

| Zmienna | Wymagana | Znaczenie |
| :- | :- | :- |
| `SLACK_APP_TOKEN` | tak | App-Level Token `xapp-` z zakresem `connections:write` |
| `SLACK_BOT_TOKEN` | tak | Bot token `xoxb-` |
| `AGENT_NAME` | tak | Twoje imię w protokole, np. `Goo` daje `[do: Claude (Goo)]` |
| `ALLOWED_SENDER_IDS` | tak | Kto może budzić Twojego agenta |
| `ALLOWED_CHANNEL_IDS` | nie | Domyślnie `C0CJECFD8QP` (`#agents`) |
| `MAX_AGENT_TURNS` | nie | Domyślnie `6` |
| `RATE_LIMIT_PER_MINUTE` | nie | Limit wiadomości na wątek na minutę w każdą stronę, domyślnie `5` |
| `AGENTS_SLACK_LOG_LEVEL` | nie | `debug`, `info`, `warn` albo `error` (logi idą na stderr) |

### 6. Zainstaluj plugin

W Claude Code:

```text
/plugin marketplace add tasteray/skills
/plugin install agents-slack-channel@tasteray-skills
```

Przy instalacji wybierz zakres użytkownika (user scope), żeby plugin działał we wszystkich projektach.

### 7. Uruchom sesję z kanałem

Gdy Owner doda plugin do `allowedChannelPlugins` (patrz niżej):

```bash
claude --channels plugin:agents-slack-channel@tasteray-skills
```

Do testów, zanim plugin trafi na listę organizacji:

```bash
claude --dangerously-load-development-channels plugin:agents-slack-channel@tasteray-skills
```

Flaga deweloperska działa tylko w sesji interaktywnej (nie z `-p`) i najpierw pokazuje ostrzeżenie do potwierdzenia. Żadna z tych flag nie jest widoczna w `claude --help`, ale działają.

Po starcie pod banerem powinien pojawić się komunikat, że wiadomości z `plugin:agents-slack-channel@tasteray-skills` trafiają do tej sesji.

Uwaga: jeśli agent trafi na pytanie o zgodę na narzędzie, sesja czeka, aż odpowiesz w terminalu. Do pracy bez nadzoru ustaw tryb uprawnień świadomie i tylko w zaufanym środowisku.

## Co musi zrobić Owner organizacji

Channels są już włączone. Własny plugin musi jeszcze trafić na listę dozwolonych pluginów kanałów w managed settings:

```json
{
  "channelsEnabled": true,
  "allowedChannelPlugins": [
    { "marketplace": "tasteray-skills", "plugin": "agents-slack-channel" }
  ]
}
```

**Ważne:** ustawienie `allowedChannelPlugins` **zastępuje** domyślną listę Anthropic, a nie ją rozszerza. Jeśli ktoś w organizacji używa też oficjalnych kanałów (Telegram, Discord, iMessage, fakechat), trzeba je dopisać, np. `{ "marketplace": "claude-plugins-official", "plugin": "telegram" }`. Pusta tablica blokuje wszystkie pluginy kanałów.

Dopóki pluginu nie ma na liście, każdy może go testować flagą `--dangerously-load-development-channels`.

## Protokół rozmowy

- **Adresowanie:** wiadomość do agenta zaczyna się od `[do: Claude (Imię)]`, np. `[do: Claude (Ola)] sprawdź build na telefonie testowym`. Działa też @-wzmianka aplikacji.
- **Podpis i status:** każda odpowiedź agenta kończy się linią `Claude (Imię) [czekam]` albo `Claude (Imię) [koniec]`.
  - `[czekam]`: agent czeka na odpowiedź.
  - `[koniec]`: wymiana skończona. Plugin przestaje przekazywać wiadomości agentów z tego wątku i nie pozwala w nim odpisywać, dopóki ktoś z zespołu (człowiek z listy) nie napisze w wątku.
- Narzędzie `reply` samo dokleja prefiks `[do: Claude (<to>)]`, podpis i status. Agent podaje tylko treść, adresata (`to`) i status.
- **Stop po 6 turach:** plugin liczy w każdym wątku kolejne wiadomości agentów bez udziału człowieka (liczą się wszystkie agenty w wątku, także Twój). Po `MAX_AGENT_TURNS` (domyślnie 6) przestaje przekazywać, a sesja dostaje jedno zdarzenie `kind="loop_limit"` z poleceniem, żeby nie odpisywać na Slacku, tylko zapytać swojego człowieka w terminalu. Wiadomość człowieka z listy zeruje licznik.
- **Limit tempa:** najwyżej `RATE_LIMIT_PER_MINUTE` wiadomości na wątek na minutę w każdą stronę.

Przykład:

```text
Goo (człowiek):  [do: Claude (Ola)] Puść testy logowania na telefonie testowym.
Claude (Ola):    [do: Claude (Goo)]
                 Testy przeszły 12/12, raport w wątku.

                 Claude (Ola) [czekam]
Claude (Goo):    [do: Claude (Ola)]
                 Dzięki, zamykam.

                 Claude (Goo) [koniec]
```

## Bezpieczeństwo

- Filtr sprawdza **nadawcę**, nie kanał, tak jak wymaga dokumentacja channels. Treść wiadomości trafia do sesji jako niezaufane dane od kolegi z zespołu, a instrukcje kanału mówią agentowi, żeby nie wykonywał poleceń wykraczających poza to, na co zgodził się jego człowiek.
- Plugin **nie** przekazuje próśb o zgodę na narzędzia na Slacka (permission relay jest wyłączony), więc nikt ze Slacka nie zatwierdzi akcji w Twojej sesji.
- Wiadomości edytowane, usunięte i systemowe są pomijane.

## Ograniczenia

- Działa tylko, gdy Twój komputer i sesja Claude Code są włączone. Wiadomości wysłane, gdy sesja nie działa, nie zostaną dostarczone później.
- Liczniki wątków są w pamięci. Restart sesji je zeruje.
- Kilka wiadomości, które przyjdą, gdy Claude pracuje, trafi do niego razem w następnej turze.
- Domyślnie tylko kanały publiczne. Dla kanału prywatnego dodaj w manifeście zakres `groups:history` i zdarzenie `message.groups`, a potem przeinstaluj aplikację.
- Channels są w research preview: składnia flag i protokół mogą się zmienić.

## Rozwiązywanie problemów

- `/mcp` w sesji pokazuje stan serwera `slack`. Status `failed` zwykle oznacza błąd konfiguracji: komunikat jest w logu debug (`claude --debug ...`, plik `~/.claude/debug/<session-id>.txt`).
- Komunikat "blocked by org policy" albo "not on the approved list": Owner musi włączyć Channels albo dodać plugin do `allowedChannelPlugins`.
- Kanał się nie rejestruje na nowym runtime MCP: plugin używa MCP SDK 1.x, który nie negocjuje rewizji 2026-07-28, więc nie powinno to wystąpić. Gdyby jednak tak było, uruchom Claude Code z `MCP_PROTOCOL_NEGOTIATION=legacy`.
- Brak reakcji na wiadomość: sprawdź, czy aplikacja jest w kanale, czy nadawca jest w `ALLOWED_SENDER_IDS` i czy znacznik ma dokładnie Twoje `AGENT_NAME`. `AGENTS_SLACK_LOG_LEVEL=debug` pokazuje powód odrzucenia każdej wiadomości.

## Rozwój

```bash
cd agents-slack-channel
bun install
bun test
bun run typecheck
```

Kod:

- `src/server.ts`: serwer MCP, Socket Mode, narzędzie `reply`
- `src/gate.ts`: filtr nadawców, licznik pętli, limit tempa
- `src/protocol.ts`: znaczniki `[do: ...]`, statusy, formatowanie odpowiedzi
- `src/config.ts`: zmienne środowiska i plik `.env`

Dokumentacja: [Channels](https://code.claude.com/docs/en/channels), [Channels reference](https://code.claude.com/docs/en/channels-reference).
