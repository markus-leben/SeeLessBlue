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
        <BirdImage src={logo} className="App-logo" alt="logo" />
          <Title>
           See Less Blue Settings
          </Title>
        </AppHeader>

        <DisplayGrid>
          {/* <div>
            <Toggle status={settingDict.showToggle} setting="showToggle" click={handleToggle}/>
            Show me a toggle to make blue users visible
          </div> */}
          <div>
            <Toggle status={settingDict.hideInReplies} setting="hideInReplies" click={handleToggle}/>
          </div>
          <div>Hide blue users in replies.</div>
          <div>
            <Toggle status={settingDict.hideInFeed} setting="hideInFeed" click={handleToggle}/>
          </div>
          <div>Hide blue users in my feed.</div>
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
  background-color: #657786;
  padding: 10px 15px;
`

const Title = styled.h2`
  color: #F5F8FA;
  display: inline-block;
`

const DisplayGrid = styled.section`
	margin-left: 0%;
	display:grid;
	column-gap: 2%;
	grid-template-columns: 34% 64%;
	grid-template-rows: 80% 10%;
	max-width: 100%;
	justify-items: stretch;
`;

const ContainingLabel = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
`

const HiddenCheck = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &::checked{
    background-color: #2196F3;
  }
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
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: #F5F8FA;
    -webkit-transition: .4s;
    transition: .4s;
    border-radius: 50%;
  }

  input:checked + & {
    background-color: #e25e0d;
  }

  input:checked + &:before {
    -webkit-transform: translateX(26px);
    -ms-transform: translateX(26px);
    transform: translateX(26px);
  }
`

export default App;

