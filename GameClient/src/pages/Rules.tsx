import { SUIT_ICONS } from "./Table";

const Rules = () => {
    return (
        <div className="bg-gray-800/90 rounded-2xl shadow-2xl px-10 py-10 flex flex-col items-center w-full max-w-xxlg">
            <h1 className="text-5xl font-extrabold mb-4 text-blue-300 drop-shadow-lg tracking-wide">Zasady</h1>
            <p className="text-lg text-gray-200 mb-8 text-center">
                "Tysiąc siadnay" to gra karciana dla 4 graczy, rozdzielnych na dwie równe drużyny.<br />
                Celem jest zdobycie <span className="font-bold text-blue-400">1000 punktów</span> przez jedną z drużyn.
            </p>
            <p className="text-lg text-gray-200 mb-4 text-justify">
                Gracze z drużyny siedzą naprzeciwko siebie. Punkty nie liczą się indywidualnie, lecz drużynowo. Gra polega na licytacji, rozdawaniu kart i grze w karty. Poniżej przedstawione są zasady gry oraz punktacja.
            </p>
            <p className="text-lg text-gray-200 mb-4 text-justify">
                Fazy gry:
                <p><strong>Rozdanie kart: </strong>Każdy z graczy dostaje po 5 kart. Pozostałe 4 idą do tak zwanego Musika</p>
                <p><strong>Faza licytacji: </strong> Gracze mogą podbijać stawkę lub spasować. Licytacja kończy się, gdy wszyscy gracze spasują lub gdy jedna z drużyn osiągnie minimalną stawkę.
                    Zależnie od ustawień gry, po otrzymaniu kart można podnieść stawkę. <i>jesli gramy "ile się ugra" faza ta zostaje pominięta.</i>
                </p>
                <p><strong>Rozdanie: </strong>Zwycięzca licytacji musi rozdać pozostałym graczom po jednej karcie, tak aby każdy miał po 6 kart.</p>
                <p><strong>Gra: </strong>Zaczyna osoba, która wygrała licytację, kładzie kartę na środek, a pozostałe osoby (kolejność jest zgonda z ruchem wskazówek zegara) muszą spróbować wygrać rozdanie. O zasadach i punktacji możesz przeczytać <a href="#wintakerules">poniżej</a>.
                    Osoba która wygra rozdanie, zaczyna następne, ten sam proces powtarza się do momentu, gdy wszyscy gracze stracą wszystkie karty.
                </p>
                <p><strong>Podliczanie punktów: </strong>Po zakończeniu rundy, podliczne są punkty dla obu drużyn. Jeśli drużyna która wygrała licytację, nie zdobyła zakładanej ilości punktów, otrzynują karę w postaci ujemnych punktów równą zakładanej wartości. Punktowanie przebiega wedle poniższej skali.</p>
            </p>
            <div className="w-full text-lg text-gray-200 mb-4 flex flex-row justify-center items-start gap-x-8">
                <div className="text-lg text-gray-200 mb-4 text-center">
                    Wartość kart:
                    <table className="max-w-xs table-auto border-collapse border border-gray-700 rounded-lg shadow-md my-4">
                        <thead className="bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-2 text-left text-blue-300 font-semibold border-b border-gray-600">Karta</th>
                                <th className="px-4 py-2 text-right text-blue-300 font-semibold border-b border-gray-600">Wartość</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800/70">
                            <tr className="border-t border-gray-700">
                                <td className="px-4 py-2 text-gray-200">As</td>
                                <td className="px-4 py-2 text-gray-200 text-right">11</td>
                            </tr>
                            <tr className="border-t border-gray-700">
                                <td className="px-4 py-2 text-gray-200">10</td>
                                <td className="px-4 py-2 text-gray-200 text-right">10</td>
                            </tr>
                            <tr className="border-t border-gray-700">
                                <td className="px-4 py-2 text-gray-200">Król</td>
                                <td className="px-4 py-2 text-gray-200 text-right">4</td>
                            </tr>
                            <tr className="border-t border-gray-700">
                                <td className="px-4 py-2 text-gray-200">Dama</td>
                                <td className="px-4 py-2 text-gray-200 text-right">3</td>
                            </tr>
                            <tr className="border-t border-gray-700">
                                <td className="px-4 py-2 text-gray-200">Walet</td>
                                <td className="px-4 py-2 text-gray-200 text-right">2</td>
                            </tr>
                            <tr className="border-t border-gray-700">
                                <td className="px-4 py-2 text-gray-200">9</td>
                                <td className="px-4 py-2 text-gray-200 text-right">0</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="text-lg text-gray-200 mb-4 text-center">
                    Meldunki i ich wartości:
                    <table className="w-auto max-w-xs table-auto border-collapse border border-gray-700 rounded-lg shadow-md my-4">
                        <thead className="bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-2 text-left text-blue-300 font-semibold border-b border-gray-600">Kolor</th>
                                <th className="px-4 py-2 text-right text-blue-300 font-semibold border-b border-gray-600">Wartość</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800/70">
                            <tr className="border-t border-gray-700">
                                <td className="px-4 py-2 text-red-700">Kier {SUIT_ICONS[3]}</td>
                                <td className="px-4 py-2 text-gray-200 text-right">100</td>
                            </tr>
                            <tr className="border-t border-gray-700">
                                <td className="px-4 py-2 text-red-700">Karo {SUIT_ICONS[4]}</td>
                                <td className="px-4 py-2 text-gray-200 text-right">80</td>
                            </tr>
                            <tr className="border-t border-gray-700">
                                <td className="px-4 py-2 text-gray-200">Trefl {SUIT_ICONS[2]}</td>
                                <td className="px-4 py-2 text-gray-200 text-right">60</td>
                            </tr>
                            <tr className="border-t border-gray-700">
                                <td className="px-4 py-2 text-gray-200">Pik {SUIT_ICONS[1]}</td>
                                <td className="px-4 py-2 text-gray-200 text-right">40</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <p className="text-lg text-gray-200 mb-4 text-justify">
                Wartości punktów są zaokrąglane do 10 <strong>PO SPRAWDZENIU CZY WYNIK JEST WYŻSZY/RÓWNY licytacji</strong>
            </p>
            <p className="text-lg text-gray-200 mb-4 text-justify">
                <strong>Zasady melodwania:</strong> Meldunkiem nazywamy parę damy i króla tego samego koloru. W klasycznej wersji gry, meldować można wychodząc damą mając króla na ręce, tylko zaczynając kolejkę. Natomiast w wersji siadanej można meldować na przeciwniku. To znaczy że jeżeli osoba przed tobą zagra damę, a ty posiadasz króla tego samego koloru, możesz zameldować. Nowy meldunek liczy się od następnej rundy.
            </p>
            <p className="text-sm text-gray-400 mt-8">
                <a href="/" className="text-blue-400 hover:underline transition-colors duration-150">
                    Powrót
                </a>
            </p>
        </div>)
}
export default Rules;