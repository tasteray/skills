"""Example deck: one slide per kind (Spostrzeżenie, Zrobione, Do zrobienia, Do poruszenia), made-up data.
Copy this file next to your deck, change it, run it:  python3 example.py  -> example-deck.html
"""
import os, sys
# ASSETS: this skill's assets folder. When you copy this file elsewhere, set it to the absolute path.
ASSETS = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ASSETS)
from build_deck import *  # noqa

HERE = ASSETS  # holds example-screen.png; put your own screenshots in img/ next to your deck
d = Deck('Daily · przykład', key='example', areas=['Onboarding', 'Powroty'])

# SPOSTRZEŻENIE: the observation in the headline, the consequence, one chart, real screen beside it
d.slide('Onboarding', 'Spostrzeżenie: odpływ na pierwszym pytaniu',
        h2='Połowa osób z Niemiec rezygnuje na pierwszym pytaniu, więc najpierw tłumaczymy ten ekran na niemiecki',
        body=side(image(os.path.join(HERE, 'example-screen.png'), 'Ekran Czego chcesz od poleceń', cls='cshot'),
                  card(hbar('Niemcy', '62 z 124 osób', 50, RED),
                       hbar('Reszta Europy', '58 z 290 osób', 20, DIM),
                       hbar('Kraje anglojęzyczne', '41 z 205 osób', 20, DIM),
                       label='Strona, 3.11 do 30.11: ilu z tych, którzy kliknęli „Find me a movie”, nie odpowiedziało na „Czego chcesz od poleceń?”',
                       cls='compact', style='flex:1')),
        cap='Dane przykładowe. Cztery tygodnie, wynik podobny w każdym z nich (47 do 53%). Ekran jest tylko po angielsku, '
            'a w pozostałych grupach odpada 20%. Źródło: panel lejków.',
        kind='stat')

# DONE: problem line, Przed / Teraz, one number with range, on production since, what is next
d.slide('Onboarding', 'Ekran powitalny po niemiecku',
        problem='ludzie z Niemiec dostawali onboarding po angielsku i połowa odpadała na pierwszym pytaniu',
        h2='Przetłumaczyliśmy pierwsze pytanie onboardingu na niemiecki',
        body=pair(
            card(journey([('globe', 'wchodzi', 'z Niemiec', DIM, True),
                          ('languages', 'pytanie', 'po angielsku', RED, True),
                          ('x', 'rezygnuje', 'co druga osoba', RED, True)], W=700), label='Przed'),
            card(journey([('globe', 'wchodzi', 'z Niemiec', DIM, True),
                          ('languages', 'pytanie', 'po niemiecku', MINT, True),
                          ('check', 'odpowiada', 'i idzie dalej', MINT, True)], W=700), label='Teraz'))
        + big('124', 'osoby z Niemiec zaczęły onboarding na stronie, 3.11 do 30.11', INK),
        cap='Dane przykładowe. Na produkcji od 1.12, 10:30. Dalej: po dwóch tygodniach sprawdzamy, czy odpływ spadł poniżej 30%.')

# TO DO: problem line, the plan as a mechanism, the task name
d.slide('Powroty', 'To do: przypomnienie po tygodniu ciszy',
        problem='kto nie otworzy aplikacji przez 7 dni, zwykle już nie wraca',
        h2='To do: wysyłamy jedno powiadomienie osobom, które nie otworzyły aplikacji przez 7 dni',
        body=journey([('moon', '7 dni', 'bez otwarcia', DIM, True),
                      ('bell', 'powiadomienie', 'z filmem z ich listy', INK, True),
                      ('check', 'wraca', 'do aplikacji', MINT, False)])
        + task('Dodanie przypomnienia po tygodniu bez otwarcia aplikacji'),
        cap='Dane przykładowe. Jedno powiadomienie na osobę w miesiącu; kto ma wyłączone powiadomienia, nie dostaje nic.',
        kind='todo')

# DO PORUSZENIA: the blocker or question, who decides, what it blocks
d.slide('Do poruszenia', 'Zgoda prawników na lokalizację',
        h2='Kampania kinowa czeka na zgodę prawną na użycie lokalizacji; potrzebujemy terminu',
        body=card(fields([('CO BLOKUJE', 'Pokazywanie seansów w pobliżu wymaga zgody na lokalizację użytkownika.'),
                          ('CO CZEKA', 'Kampania kinowa do wszystkich użytkowników w Polsce.'),
                          ('PYTANIE', 'Kiedy będzie odpowiedź z przeglądu prawnego?')]),
                  style='max-width:760px'),
        cap='Dane przykładowe.',
        kind='ask')

print(d.write(os.path.join(os.getcwd(), 'example-deck.html')))
