-- Function and Trigger for DELETE
CREATE OR REPLACE FUNCTION update_voter_status_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE directivos_docentes
    SET estado = 'ACTIVO'
    WHERE id = OLD.id_directivo;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_voter_status_on_delete ON votos;
CREATE TRIGGER trigger_voter_status_on_delete
AFTER DELETE ON votos
FOR EACH ROW
EXECUTE FUNCTION update_voter_status_on_delete();

-- Function and Trigger for INSERT
CREATE OR REPLACE FUNCTION update_voter_status_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE directivos_docentes
    SET estado = 'VOTO_REGISTRADO'
    WHERE id = NEW.id_directivo;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_voter_status_on_insert ON votos;
CREATE TRIGGER trigger_voter_status_on_insert
AFTER INSERT ON votos
FOR EACH ROW
EXECUTE FUNCTION update_voter_status_on_insert();
