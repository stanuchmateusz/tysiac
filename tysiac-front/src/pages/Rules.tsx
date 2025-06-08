import { SUIT_ICONS } from "./Table";

const Rules = () => {
    return (
        <div className="bg-gray-800/90 rounded-2xl shadow-2xl px-10 py-10 flex flex-col items-center w-full max-w-lg">
            <h1 className="text-5xl font-extrabold mb-4 text-blue-300 drop-shadow-lg tracking-wide">Zasady</h1>
            <p className="text-lg text-gray-200 mb-8 text-center">
                "Tysiąc siadnay" to gra karciana dla 4 graczy, rozdzielnych na dwie równe drużyny.<br />
                Celem jest zdobycie <span className="font-bold text-blue-400">1000 punktów</span> przez jedną z drużyn.
            </p>
            <p className="text-lg text-gray-200 mb-4 text-center">
                W tysiąca gra się 24 kartami, od As'a do 9. Każda karta ma swoją wartość:
            </p>
            <table className="w-auto max-w-xs table-auto border-collapse border border-gray-700 rounded-lg shadow-md my-4">
                <thead className="bg-gray-700/50">
                    <tr >
                        <th className="px-4 py-2 text-left text-blue-300 font-semibold border-b border-gray-600">Karta</th>
                        <th className="px-4 py-2 text-right text-blue-300 font-semibold border-b border-gray-600">Wartość</th>
                    </tr></thead>
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
                        <td className="px-4 py-2 text-gray-200">Jopek</td>
                        <td className="px-4 py-2 text-gray-200 text-right">2</td>
                    </tr>
                    <tr className="border-t border-gray-700">
                        <td className="px-4 py-2 text-gray-200">9</td>
                        <td className="px-4 py-2 text-gray-200 text-right">0</td>
                    </tr>
                </tbody>
            </table>
            Na początku gry każdy z graczy dostaje po 5 kart.


            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer pellentesque fermentum lacus et maximus. Phasellus quis turpis posuere, finibus lorem a, mattis libero. Vivamus mollis, velit sit amet eleifend luctus, arcu augue maximus nulla, nec faucibus eros eros eu lacus. Nam eu eros malesuada, ultrices velit a, volutpat ligula. Aliquam id ipsum nisl. Phasellus tristique mauris quis ex varius pulvinar. Nullam cursus justo eu urna suscipit, ut vulputate nisl vehicula. Donec non ante sit amet purus vulputate hendrerit. Donec viverra commodo diam non pulvinar.

            Sed aliquam lectus ac sapien bibendum dignissim. Fusce quis maximus eros, eget vehicula sem. Aliquam placerat, tortor viverra scelerisque mollis, purus leo varius sapien, sed luctus lectus dolor vitae erat. Maecenas tristique metus quis ante vehicula feugiat. Suspendisse magna ligula, vulputate at eros at, laoreet porttitor neque. Nam felis neque, mattis quis ullamcorper vel, tincidunt a mauris. Morbi euismod aliquet mauris blandit eleifend. Mauris dictum commodo augue. Vivamus orci lorem, consequat at nunc a, tempor sodales eros. Nam posuere erat vel pharetra rutrum. Quisque viverra quis lacus a molestie. Quisque at consectetur lorem. Vivamus nec lacus gravida, laoreet purus non, fringilla sapien.

            Meldunki:
            <table className="w-auto max-w-xs table-auto border-collapse border border-gray-700 rounded-lg shadow-md my-4">
                <thead className="bg-gray-700/50">
                    <tr >
                        <th className="px-4 py-2 text-left text-blue-300 font-semibold border-b border-gray-600">Kolor</th>
                        <th className="px-4 py-2 text-right text-blue-300 font-semibold border-b border-gray-600">Wartość</th>
                    </tr></thead>
                <tbody className="bg-gray-800/70">
                    <tr className="border-t border-gray-700">
                        <td className="px-4 py-2 text-red-700">{SUIT_ICONS[3]}</td>
                        <td className="px-4 py-2 text-gray-200 text-right">100</td>
                    </tr>
                    <tr className="border-t border-gray-700">
                        <td className="px-4 py-2 text-red-700">{SUIT_ICONS[4]}</td>
                        <td className="px-4 py-2 text-gray-200 text-right">80</td>
                    </tr>
                    <tr className="border-t border-gray-700">
                        <td className="px-4 py-2 text-gray-200">{SUIT_ICONS[2]}</td>
                        <td className="px-4 py-2 text-gray-200 text-right">60</td>
                    </tr>
                    <tr className="border-t border-gray-700">
                        <td className="px-4 py-2 text-gray-200">{SUIT_ICONS[1]}</td>
                        <td className="px-4 py-2 text-gray-200 text-right">40</td>
                    </tr>
                </tbody>
            </table>
            <p className="text-sm text-gray-400 mt-8">
                <a href="/" className="text-blue-400 hover:underline transition-colors duration-150">
                    Powrót
                </a>
            </p>
        </div>)
}
export default Rules;