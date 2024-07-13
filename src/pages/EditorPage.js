import React, { useState, useRef, useEffect } from 'react';
import Client from '../components/Client';
import Editor from '../components/Editor';
import ACTIONS from '../Actions';
import { initSocket } from '../socket';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const EditorPage = () => {
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const location = useLocation();
  const { roomId } = useParams();
  const reactNavigator = useNavigate();
  const [clients, setClients] = useState([]);

  useEffect(() => {
    const init = async () => {
      try {
        socketRef.current = await initSocket();
        socketRef.current.on('connect_error', handleErrors);
        socketRef.current.on('connect_failed', handleErrors);

        function handleErrors(e) {
          console.log('socket error', e);
          toast.error('Socket connection failed, try again later.');
          reactNavigator('/');
        }

        socketRef.current.emit(ACTIONS.JOIN, {
          roomId,
          username: location.state?.username,
        });

        socketRef.current.on(ACTIONS.JOINED, ({ clients, username, socketId }) => {
          if (username !== location.state?.username) {
            toast.success(`${username} Joined the room successfully.`);
          }
          setClients(clients);
          setClients((prevClients) => {
            const uniqueClients = [...prevClients, ...clients].filter((client, index, self) =>
              index === self.findIndex((c) => c.socketId === client.socketId)
            );
            return uniqueClients;
          });
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current,
            socketId,
          });

        });

        socketRef.current.on(ACTIONS.CLIENT_JOINED, ({ clients }) => {
          setClients((prevClients) => {
            const uniqueClients = [...prevClients, ...clients].filter((client, index, self) =>
              index === self.findIndex((c) => c.socketId === client.socketId)
            );
            return uniqueClients;
          });
        });

        socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
          toast.success(`${username} left the room.`);
          setClients((prev) => {
            return prev.filter((client) => client.socketId !== socketId);
          });
        });

      } catch (error) {
        console.error('Socket initialization failed', error);
        toast.error('Socket initialization failed, try again later.');
        reactNavigator('/');
      }
    };

    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.CLIENT_JOINED);
      }
    };
  }, [roomId, location.state?.username, reactNavigator]);

  async function copyRoomId() {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success('Room ID copied to clipboard.');
    } catch (err) {
      toast.error('Could not copy the Room Id');
    }
  }

  function leaveRoom() {
    reactNavigator('/');
  }

  if (!location.state) {
    return <Navigate to="/" />;
  }

  return (
    <div className='mainWrap'>
      <div className='aside'>
        <div className='asideInner'>
          <div className='logo'>
            <img className='logoImage' src='/code.png' alt='logo' />
          </div>
          <h3>Connected</h3>
          <div className='clientsList'>
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
        </div>
        <button className='btn copybtn' onClick={copyRoomId}>Copy Room Id</button>
        <button className='btn leavebtn' onClick={leaveRoom}>Leave Room</button>
      </div>
      <div className='editorWrap'>
        <Editor socketRef={socketRef} roomId={roomId} onCodeChange={(code) =>{
          codeRef.current = code;
        }}/>
      </div>
    </div>
  );
};

export default EditorPage;
