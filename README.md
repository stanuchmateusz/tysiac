# Tysiąc siadany
**Zmodyfikowana wersja znanej gry w tysiąca**

## Build with:
* React + Tailwindcss for the client
* .NET 9 for the server
* Connection via signalR

## How to run:
I strongly recommend using docker. To run it just git clone the repo and use ``` docker-compose up -d ``` Default client adress is http://localhost:5173/
However if you want to run it without docker then keep in mind that in order to use custom decks you will need to run generate_skins_json.bat/sh script to update skins.json file

## Todo:
* Jeśli ostatnim ruchem jest meldunek (i się nie zaczynało) to wartość meldunku się nie odlicza do wyniku - problem z kolejkowaniem? 
* Game settings 
* Better animations
* Ban after kick
* Lobby - team mixing
* Better AI
* Chat autoscroll
* Failed to copy code: TypeError: navigator.clipboard is undefined - not working if page is not secure

## Default Assets:
[Sounds](https://pixabay.com) \
[Cards](https://www.me.uk/cards/) 