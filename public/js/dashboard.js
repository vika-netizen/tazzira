async function loadBookings(){

    const res =
    await fetch('/my-bookings');

    const bookings =
    await res.json();

    const container =
    document.getElementById('bookings');

    if(bookings.length === 0){

        container.innerHTML =
        "Записів немає";

        return;
    }

    container.innerHTML = '';

    bookings.forEach(item => {

        container.innerHTML += `
            <div style="
                margin-bottom:15px;
                padding:15px;
                background:#262626;
                border-radius:12px;
            ">

                <strong>
                    ${item.name}
                </strong>

                <p>
                    ${item.date}
                </p>

                <p>
                    ${item.time}
                </p>

            </div>
        `;
    });
}

loadBookings();


async function loadStats(){

    const res =
    await fetch('/dashboard-stats');

    const stats =
    await res.json();

    document.getElementById(
        'activeBookings'
    ).innerText =
    stats.activeBookings;

    document.getElementById(
        'subscriptionDays'
    ).innerText =
    stats.subscriptionDays;

}

loadStats();

