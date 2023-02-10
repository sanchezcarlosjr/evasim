import "./App.css";
import * as React from 'react';
import { TerminalContextProvider } from "react-terminal";
import { ReactTerminal } from "react-terminal";
import { Peer } from 'peerjs';
import { startPeerConnection } from "./peer";
import { ReactComponent as LoaderIcon } from "./assets/loader.svg";


window.Peer = Peer;

const App = () => {
  const [theme, setTheme] = React.useState("light");
  const [error, setError] = React.useState("connection_error");
  const [loader, setLoader] = React.useState("loader",  {message: "Waitining a signal server", done: false});
  const [controlBar, setControlBar] = React.useState(true);
  const [controlButtons, setControlButtons] = React.useState(true);
  const [prompt, setPrompt] = React.useState(">>>");

  const subscriber = {
        assign_signal: (state: any) => {
	    state.join2();
	    setLoader({message: "Assigning a signal.", done: false});
	},
	connection_open: () => {
	    setLoader({message: "Succesful connection!", done: true});
	},
	join_connection: () => {
	    setLoader({message: "Joining to peer.", done: false});
	},
	close: () => {
	    setLoader({message: "Closing connection.", done: false});
	},
	error: (state: any, error: any) => {
	   setLoader({message: `Oops! Something wrong happened "${error.message}"`, done: false});
	},
	disconnected: () => {
	   setLoader({message: `Disconnected!`, done: false});
	}
  };
   React.useEffect(() => {   
     const id = new URLSearchParams(document.location.search).get("session");
     if (id === null)
       return null;
   }, []);

  const commands = {
    help: (
      <span>
        <strong>clear</strong> - clears the console. <br />
        <strong>connect</strong> - connects to EVA by id. <br />
        <strong>stop</strong> - stops the EVA interaction<br />
        <strong>debugger</strong> - shows the EVA state.<br />
        <strong>restart</strong> - restarts EVA interaction.<br />
        <strong>change_prompt &lt;PROMPT&gt;</strong> - changes the prompt of the
        terminal. <br />
        <strong>change_theme &lt;THEME&gt;</strong> - changes the theme of the
        terminal. Allowed themes - light, dark, material-light, material-dark,
        material-ocean, matrix and dracula. <br />
        <strong>toggle_control_bar</strong> - hides / displays the top control
        bar. <br />
        <strong>toggle_control_buttons</strong> - hides / displays the top
        buttons on control bar. <br />
      </span>
    ),

    connect: (id) => {
       startPeerConnection(subscriber).join(id);
       const url = new URL(window.location);
       url.searchParams.set('session', id);
       window.history.pushState({}, '', url);
       return <div className="a"> <span>{loader.done ? <span>👌</span> : <LoaderIcon/>} {loader.message}</span> </div>;
    },

    change_prompt: (prompt: string) => {
      setPrompt(prompt);
    },

    change_theme: (theme: string) => {
      const validThemes = [
        "light",
        "dark",
        "material-light",
        "material-dark",
        "material-ocean",
        "matrix",
        "dracula",
      ];
      if (!validThemes.includes(theme)) {
        return `Theme ${theme} not valid. Try one of ${validThemes.join(", ")}`;
      }
      setTheme(theme);
    },

    toggle_control_bar: () => {
      setControlBar(!controlBar);
    },

    toggle_control_buttons: () => {
      setControlButtons(!controlButtons);
    }

  };

  const welcomeMessage = (
	  <span>Type "help" for all available commands. <br /> </span> 
  );

  return (
    <div className="App">
      <TerminalContextProvider>
        <ReactTerminal
          prompt={prompt}
          theme={theme}
          showControlBar={controlBar}
          showControlButtons={controlButtons}
          welcomeMessage={welcomeMessage}
          commands={commands}
          defaultHandler={(command: any, commandArguments: any) => {
            return `${command} passed on to default handler with arguments ${commandArguments}`;
          }}
        />
      </TerminalContextProvider>
    </div>
  );
}

export default App
