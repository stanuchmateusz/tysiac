using System.Text;

namespace GameServer.Utils;
public static class RandomUtils
{
    private static readonly Random _random = new Random();

    public static string GenerateRandomName()
    {
        List<string> names =
        [
            "Adam","Ewa","Kasia","Marek","Ania","Tomek","Ola","Piotr",
            "Krzysztof","Magda","Bartek","Agnieszka","Michał","Natalia",
            "Łukasz","Karolina","Paweł","Justyna","Marcin","Monika",
            "Norbert","Katarzyna","Grzegorz","Joanna","Rafał",
            "Marta","Szymon","Alicja","Jakub","Julia","Mateusz","Zuzanna",
            "Wiktoria","Kacper","Aleksandra","Filip","Martyna","Bartosz",
            "Jakub","Julia","Grzyb","Zuzanna","Szymon","Wiktoria",
            "Kacper","Aleksandra","Filip","Martyna","Bartosz","Emilia",
            "Damian","Patrycja","Sebastian","Gabriela","Adrian","Olga",
            "Rafał","Maja","Dominik","Hanna","Wojciech",
            "Kamil","Zofia","Tomasz","Lena","Artur","Amelia","Mariusz",
            "Ewelina","Grzegorz","Klaudia","Sławomir","Izabela","Dawid",
            "Joanna","Radosław","Sandra","Marta","Waldemar","Elżbieta"
        ];
        return names[_random.Next(names.Count)];
    }

    public static string GenerateRoomCode()
    {
        const string validChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var roomCode = new StringBuilder();
        while (roomCode.Length < 8)
            roomCode.Append(validChars[_random.Next(validChars.Length)]);
        return roomCode.ToString();
    }
}