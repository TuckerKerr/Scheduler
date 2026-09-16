-- Run once against the Schedule database before deploying the rewritten scheduler.
-- Backs the atomic 3-people-per-slot capacity check in db_connect.php.
CREATE TABLE IF NOT EXISTS Slot_Locks (
    shift_date DATE NOT NULL,
    time_id VARCHAR(20) NOT NULL,
    campus VARCHAR(50) NOT NULL,
    PRIMARY KEY (shift_date, time_id, campus)
) ENGINE=InnoDB;
