import React, { useState } from 'react';
import {v4 as uuidV4} from 'uuid';
import toast from 'react-hot-toast';
import {useNavigate} from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const[roomId, setRoomId] = useState('');
  const[username, setUsername] = useState('');
  const createNewRoom = (e) =>{
    e.preventDefault();
    const id = uuidV4();
    setRoomId(id);
    toast.success("Created a new Room Id");
  };

  const joinRoom = () =>{
    if(!roomId || !username){
      toast.error("Please enter a valid Room Id and Username");
      return;
    }
    //Redirect
    navigate(`/editor/${roomId}`,{
      state: {
        username,
      }
    })
    // toast.success("Joining Room");
  }
  return (
    <div className='homePageWrapper'>
      <div className='formWrapper'>
        <img src='/code.png' alt='logo' />
        <h4 className='mainLabel'>Paste invitation ROOM ID</h4>
        <div className='inputGroup'>
          <input 
            type='text' 
            className='input' 
            placeholder='ROOM ID'  
            onChange={(e) => setRoomId(e.target.value)}
            value={roomId}
          />
          <input 
            type='text' 
            className='input' 
            placeholder='USERNAME' 
            onChange={(e) => setUsername(e.target.value)}
            value={username}
          />
          <button className='btn joinbtn' onClick={joinRoom}>Join</button>
          <span className='createInfo'></span>
          <a onClick={createNewRoom} href='' className='createNewBtn'>Generate Unique Room ID</a>
        </div>
      </div>
      <footer>
        <h4>Built by <a href='https://github.com/Sumitkatkam'>Sumit Katkam</a></h4>
      </footer>
    </div>
  );
}

export default Home;