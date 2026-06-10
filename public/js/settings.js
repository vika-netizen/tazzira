const modal =
document.getElementById('passwordModal');

const changeBtn =
document.getElementById('changePasswordBtn');

const saveBtn =
document.getElementById('savePasswordBtn');

/* OPEN */

changeBtn.onclick = () => {

    modal.style.display = 'flex';

};

/* CLOSE */

window.onclick = (e) => {

    if(e.target === modal){

        modal.style.display = 'none';

    }

};

/* SAVE */

saveBtn.onclick = async () => {

    const password =
    document.getElementById('newPassword').value;

    if(password.length < 4){

        alert('Пароль закороткий');

        return;
    }

    const res =
    await fetch('/change-password', {

        method:'POST',

        headers:{
            'Content-Type':'application/json'
        },

        body:JSON.stringify({
            password
        })

    });

    const text =
    await res.text();

    alert(text);

    modal.style.display = 'none';

};