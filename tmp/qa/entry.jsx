import { renderToString } from 'react-dom/server'
import { createElement } from 'react'
import App from '../../src/App.jsx'
import { StaffPickupList } from '../../src/JourneyViews.jsx'
export function render() { return renderToString(createElement(App)) }
export function renderPickup(pass) { return renderToString(createElement(StaffPickupList, { pass })) }
