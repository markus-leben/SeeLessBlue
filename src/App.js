import logo from './lessblue.svg';
import React, {useState, useEffect} from 'react';
import styled from "styled-components";
import isEqual from 'lodash.isequal';

async function sendSettingUpdateMessage() {
  const response = await chrome.runtime.sendMessage({greeting:"settings updated"});
  // do something with response here, not outside the function
}

// async function sendActiveTabUpdate() {
//   const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
//   console.log(tab)
//   if (tab.url.includes("twitter.com")){
//     const response = await chrome.tabs.sendMessage(tab.id, {greeting: "setting button toggled"});
//     // do something with response here, not outside the function
//     console.log(response);
//   }
// }

function App() {
  // default settings is an empty object
  const [settingDict, setSettingDict] = useState({})
  const [loadDone, setLoadDone] = useState(false)

  const toggleSetting = (settingName) => {
    setSettingDict((oldSettingDict) => ({...oldSettingDict, [settingName]:!oldSettingDict[settingName]}));

  }

  const handleToggle = (event) => {
    toggleSetting(event.target.id);
  }


  // load settings on initial page load
  useEffect(() => {
    chrome.storage.local.get(["settings"]).then((result) => {
      console.log('saved settings', result.settings)
      if (result.settings === undefined) {
        console.log('result settings is undefined')
        setSettingDict({hideInReplies:true,hideInFeed:true})
      } else {
        setSettingDict(result.settings)
      }
      setLoadDone(true);
    })
  }, []);

  // update settings on change
  useEffect(() => {
    if (loadDone) {
      // after loading, check settings and if they've changed then update settings and message other parts of extension
      chrome.storage.local.get(["settings"]).then((result) => {
        console.log('saved settings', result.settings)
        console.log('current settings', settingDict)
        console.log('did it match', isEqual(result.settings, settingDict))
        if (!isEqual(result.settings, settingDict)) {
          chrome.storage.local.set({"settings": settingDict}).then(() => {console.log(settingDict)})
          sendSettingUpdateMessage()
          // sendActiveTabUpdate()
        }
      })

    }

 }, [settingDict]);

  return (
    <div className="App">
      {  Object.keys(settingDict).length !== 0 ?
      <>
        <AppHeader className="App-header">
        <HeaderGrid>
          <BirdImage src={logo} className="App-logo" alt="logo" />
          <Title>
            See Less Blue Settings
          </Title>
        </HeaderGrid>
        </AppHeader>

        <DisplayGrid>
          {/* <div>
            <Toggle status={settingDict.showToggle} setting="showToggle" click={handleToggle}/>
            Show me a toggle to make blue users visible
          </div> */}
          <div>
            <Toggle status={settingDict.hideInReplies} setting="hideInReplies" click={handleToggle}/>
          </div>
          <ToggleInstructions>Hide blue users in replies.</ToggleInstructions>
          <div>
            <Toggle status={settingDict.hideInFeed} setting="hideInFeed" click={handleToggle}/>
          </div>
          <ToggleInstructions>Hide blue users in my feed.</ToggleInstructions>
        </DisplayGrid>
      </> : null
      }

    </div>
  );
}

// toggle lifted shamelessly from w3 and converted into styled components

const Toggle = (props) => {
  const [checked, setChecked] = useState(props.status)
  useEffect(() => {setChecked(props.status)}, [props.status])
  return (
  <ContainingLabel>
    <HiddenCheck checked={checked} type="checkbox"></HiddenCheck>
    <Slider id={props.setting} onClick={props.click}/>
  </ContainingLabel>)
}

const BirdImage = styled.img`
  width: 30px;
  height: 30px;
`

const AppHeader = styled.header`
`

const HeaderGrid = styled.div`
  padding: 10px 5px;
  display:grid;
  grid-template-columns: 30px 1fr;
  column-gap: 10px;
  justify-items: start;
  align-items: center;
  background-color: black;
`

const Title = styled.h2`
  color: #F5F8FA;
  display: inline-block;
`

const DisplayGrid = styled.section`
  padding: 10px 10px;
	margin-left: 0%;
	display:grid;
  row-gap: 10px;
	grid-template-columns: 40px 1fr;
  column-gap: 10px;
	grid-template-rows: 22px 22px;
	max-width: 100%;
	justify-items: start;
  align-items: center;
`;

const ContainingLabel = styled.label`
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
`

const HiddenCheck = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &::checked{
    background-color: #2196F3;
  }
`

const ToggleInstructions = styled.div`
  font-size: 1.35em;
`

const Slider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #AAB8C2;
  -webkit-transition: .4s;
  transition: .4s;
  border-radius: 34px;

  &::before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 3px;
    bottom: 3px;
    background-color: #F5F8FA;
    -webkit-transition: .25s;
    transition: .25s;
    border-radius: 50%;
  }

  input:checked + & {
    background-color: #e25e0d;
  }

  input:checked + &:before {
    -webkit-transform: translateX(18px);
    -ms-transform: translateX(18px);
    transform: translateX(18px);
  }
`

export default App;

