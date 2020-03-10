import Login from './ui/Login/Login.vue'
// import Login from './ui/template-ui/template-ui.vue'
import App from './ui/App/App.vue'
import Meeting from './components/Meeting/Meeting.vue'
import MeetingProject from './components/MeetingProject/MeetingProject.vue'

export default {
    routes: [{
        path: '/',
        name: 'login',
        component: Login
    },
    {
        path: '/app/:componentName',
        name: 'app',
        component: App
    },
    {
        path: '/meeting',
        name: 'meeting',
        component: Meeting
    },
    {
        path: '/meeting-project',
        name: 'meetingproject',
        component: MeetingProject
    }
    ]
}
