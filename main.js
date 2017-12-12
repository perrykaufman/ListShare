var config = {
    apiKey: "AIzaSyAPGzVCjpt0Fmaduy5e6KduX3MWCmqgRzI",
    authDomain: "it354final.firebaseapp.com",
    databaseURL: "https://it354final.firebaseio.com",
    projectId: "it354final",
    storageBucket: "it354final.appspot.com",
    messagingSenderId: "517777989236"
};
firebase.initializeApp(config);

//SIGN UP
Vue.component('sign-up-page', {
    data: function () {
        return {
            first: '',
            last: '',
            email: '',
            password: '',
            confirm: ''
        }
    },
    methods: {
        signUp() {
            if (this.email === '') {
                vm.error = 'Must include email'
                return
            }
            if (this.first === '') {
                vm.error = 'Must include first name'
                return
            }
            if (this.last === '') {
                vm.error = 'Must include last name'
                return
            }
            if (this.password === '') {
                vm.error = 'Must include password'
                return
            }
            if (this.password !== this.confirm) {
                vm.error = 'Passwords must match'
                return
            }
            vm.signUpUser(this.first, this.last, this.email, this.password)
        }
    },
    mounted: function () {
        console.log('signup mounted')
    }
})


//SIGN IN
Vue.component('sign-in-page', {
    data: function () {
        return {
            email: '',
            password: ''
        }
    },
    methods: {
        signIn: function () {
            if (this.email === '') {
                vm.error = 'Must include an email'
                return
            }
            if (this.password === '') {
                vm.error = 'Must include password'
                return
            }
            vm.signInUser(this.email, this.password)
        }
    },
    mounted: function () {
        console.log('signin mounted')
    }
})

//CREATE LIST
Vue.component('create-list-page', {
    data: function () {
        return {
            name: ''
        }
    },
    methods: {
        create: function () {
            vm.createList(this.name)
        }
    },
    mounted: function () {
        console.log('create mounted')
    }
})

//VIEW LIST
Vue.component('view-list-page', {
    data: function () {
        return {
            name: ''
        }
    },
    methods: {
        add: function () {
            vm.addToCurrentList(this.name)
            this.name = ''
        },
    },
    computed: {
        listCreator: function() {
            if (vm.currentList.user == null) {
                return 'you'
            }
            return vm.currentList.user.first
        },
        orderedList: function() {
            if (vm.currentList.priority === true) {

            }
            return vm.currentList.items
        }
    },
    mounted: function () {
        console.log('list mounted')
        if (vm.currentList === '') {
            vm.error = 'must select a list'
            vm.page = 'default'
            return
        }
        vm.completeCurrentList()
        this.name = ''
    }
})

//VIEW INVITES
Vue.component('view-invites-page', {
    data: function () {
        return {}
    },
    mounted: function () {
        console.log('invites mounted')
    }
})

//MAIN MENU
Vue.component('main-menu-page', {
    data: function () {
        return {}
    },
    methods: {
        goToCreate: function () {
            vm.page = 'create'
        },
        goToList: function () {
            vm.page = 'list'
        },
        goToInvites: function () {
            vm.page = 'invites'
        }
    },
    mounted: function () {
        console.log('main menu mounted')
        vm.updateState()
        vm.currentList = ''
    }
})

//VUE INSTANCE
var vm = new Vue({
    el: '#app',
    data: {
        page: 'default',
        auth: false,
        error: '',
        first: '',
        last: '',
        currentList: '',
        lists: [],
        sharedLists: [],
        invites: []
    },
    methods: {
        signInUser: function (email, password) {
            firebase.auth().signInWithEmailAndPassword(email, password)
                .then(function () {

                    console.log('sign in success! ' + firebase.auth().currentUser.email)
                })
                .catch(function (error) {
                    vm.error = error.message
                })
        },
        signUpUser: function (first, last, email, password) {
            firebase.auth().createUserWithEmailAndPassword(email, password)
                .then(function () {
                    var path = 'users/' + emailToKey(email)
                    firebase.database().ref(path).set({
                        name: {
                            first: first,
                            last: last
                        },
                        email: email
                    })
                    vm.first = first
                    vm.last = last
                    console.log('sign up success! ' + firebase.auth().currentUser.email)
                }).catch(function (error) {
                    vm.error = error.message
                })
        },
        signOutUser: function () {
            firebase.auth().signOut()
        },
        updateState: function () {
            this.setLists()
            this.setShared()
            this.setInvites()
        },
        createList: function (name) {
            var path = 'users/' + emailToKey(this.getEmail()) + '/lists/' + name

            firebase.database().ref(path).once('value').then(function (snapshot) {
                if (snapshot.val() != null) {
                    vm.error = 'list already exists'
                    return
                }
                firebase.database().ref(path).set({
                        items: 'empty'
                    })
                    .then(function () {
                        vm.page = 'default'
                    })
                    .catch(function () {
                        vm.error = 'list could not be created'
                    })
            })
        },
        setName: function () {
            var path = 'users/' + emailToKey(vm.getEmail()) + '/name'
            firebase.database().ref(path).once('value').then(function (snapshot) {
                vm.first = snapshot.val().first
                vm.last = snapshot.val().last
            })
        },
        setLists: function () {
            var path = 'users/' + emailToKey(this.getEmail()) + '/lists'
            firebase.database().ref(path).once('value').then(function (snapshot) {
                vm.lists = []
                var lists = snapshot.val()
                if (!lists) return
                var names = Object.keys(lists)
                for (var name in lists) {
                    vm.lists.push(new List(null, name, null))
                }
            }).catch(function () {
                console.log('error: could not get lists')
            })
        },
        setShared: function () {

        },
        setInvites: function () {

        },
        getEmail: function () {
            var current = firebase.auth().currentUser
            if (current === null) return null
            return current.email
        },
        completeCurrentList: function () {
            if (this.currentList === '' || this.currentList == null) {
                console.log('error: cannot complete invalid current list')
                return
            }
            var path = 'users/'
            if (this.currentList.user == null) {
                path += emailToKey(this.getEmail())
            } else {
                path += emailToKey(this.currentList.user.email)
            }
            path += '/lists/' + this.currentList.name
            firebase.database().ref(path).once('value').then(function (snapshot) {
                var items = snapshot.val().items
                if (items === 'empty' || items == null) {
                    vm.currentList.items = []
                } else {
                    vm.currentList.items = items
                }
            }).catch(function () {
                console.log('error: could not find currentList')
            })
        },
        addToCurrentList: function (name) {
            var path = 'users/'
            if (this.currentList.user == null) {
                path += emailToKey(this.getEmail())
            } else {
                path += emailToKey(this.currentList.user.email)
            }
            path += '/lists/' + this.currentList.name
            var newItem = new ListItem(new User(vm.getEmail(), vm.first), name)
            firebase.database().ref(path).once('value').then(function (snapshot) {
                var items = snapshot.val().items
                if (items === 'empty' || items === null) {
                    vm.currentList.items = [newItem]
                    firebase.database().ref(path).update({
                        items: [newItem]
                    })
                } else {
                    console.log(items)
                    vm.currentList.items = items
                    vm.currentList.items.push(newItem)
                    firebase.database().ref(path + '/items').set(vm.currentList.items)
                }
            })
        }
    },
    computed: {
        listOptions: function () {
            return this.lists
        },
        pageName: function () {
            if (this.page === 'signup') return 'Sign up'
            if (this.page === 'create') return 'Create List'
            if (this.page === 'list') return 'List'
            if (this.page === 'invites') return 'Invites'
            return 'Main'
        }
    },
    watch: {
        page: function () {
            this.error = ''
        }
    },
    created: function () {
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                vm.auth = true
                vm.setName()
            } else {
                vm.auth = false
            }
            vm.page = 'default'
        })
    }
})

function List(user, name, items) {
    this.user = user
    this.name = name
    this.items = items
}

function ListItem(user, name) {
    this.user = user
    this.name = name
}

function User(email, first) {
    this.email = email
    this.first = first
}

function Invite(userFrom, listName) {
    this.userFrom = userFrom
    this.listName = listName
}

function emailToKey(email) {
    return email.replace(/[.]/g, '%20');
}