# Tysiąc siadany
**Zmodyfikowana wersja znanej gry w Tysiąca**

## Build with:
* React + Tailwindcss for the client
* .NET 9 for the server
* Connection via signalR

## How to run:
I strongly recommend using docker. To run it just git clone the repo and use ```docker-compose up -d ``` Default client adress is http://localhost:5173/
However if you want to run it without docker then keep in mind that in order to use custom decks you will need to run generate_skins_json.bat/sh script to update skins.json file, and have them in public/asstes/CUSTOM_SKIN_NAME folder
## Custom decks
If you want to create your own deck, create a new folder in GameClient/customs (can be changed in "docker-compose.yml") and fill it with 24 svgs (just like "custom1")
## Todo:
* Bug when reconnecting, position of cards on the table is wrong
* Rebuild lobby backend:
    - Lobby - team mixing
* Better AI
* If game starts with bot players, table doesn't load until it's human player's turn
* lobby leader sometimes doesnt change on page closed

## Default Assets:
[Sounds](https://pixabay.com) \
[Cards](https://www.me.uk/cards/) 