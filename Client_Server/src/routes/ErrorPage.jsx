import React from 'react';
import { useRouteError } from 'react-router-dom';

// A beautiful error page for the client
export default function ErrorPage(props) {
    const error = useRouteError();

    return (
        <div>
        <h1>Oops, something went wrong</h1>
        <p>{error.statusText || error.message}</p>
        </div>
    );
}