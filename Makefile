all:
	 yarn --cwd terminal build && rm -rf public/terminal && mv terminal/dist/ public/terminal

deploy:
	firebase deploy
