import React, { lazy } from 'react'
import ReactDOM from 'react-dom/client'
import Circle from './components/CircleMouse'
import { ToastProvider } from 'rc-toastr'
import { SocketProvider } from './api/SocketProvider'

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom"

import Lobby from './routes/Lobby'
import WaitR from './routes/WaitR'
import Partida from './routes/Partida'
import ErrorPage from './routes/ErrorPage'

import './index.css'
import "rc-toastr/dist/index.css"

//For the browser router all elements must be inside the SocketProvider
const BrowserRouter = createBrowserRouter([
  {
    element: <SocketProvider />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/',
        element: <Lobby />,
      },
      {
        path: '/WaitR/:RoomId',
        element: <WaitR />,
      },
      {
        path: '/Partida/:RoomId',
        element: <Partida />,
      },
    ],
  }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>

  <ToastProvider config={{
    position: 'top',
    duration: 2000,
    pauseOnHover: false,
    maxToasts: 3,
    autoClose: true,
    showProgressBar: false,
  }}>

      <RouterProvider
      router={BrowserRouter}/>

  </ToastProvider>

  //</React.StrictMode>, */
)
