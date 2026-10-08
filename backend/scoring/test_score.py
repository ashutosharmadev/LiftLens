import pytest

from score import NOISE_THRESHOLD, progress_result, ratio_result


class TestRatioResult:
    def test_reports_the_ratio_as_the_first_photo_baseline(self):
        result = ratio_result(1.784)
        assert result.value == pytest.approx(1.784)
        assert result.status == "baseline"
        assert result.inputs == {"shoulder_to_waist": 1.784}
        assert result.explanation == "Your shoulders are 1.78× as wide as your waist."

    def test_states_its_formula(self):
        assert "shoulder_width / waist_width" in ratio_result(1.5).formula


class TestProgressResult:
    # Riya's example from docs/scoring.md.
    def test_rise_beyond_noise_is_an_increase(self):
        result = progress_result(current=1.78, baseline=1.70)
        assert result.value == pytest.approx(4.70588, rel=1e-4)
        assert result.status == "increased"
        assert result.explanation == (
            "Your shoulder-to-waist ratio rose 4.7% since your first photo (1.70 → 1.78)."
        )

    def test_fall_beyond_noise_is_a_decrease(self):
        result = progress_result(current=1.60, baseline=1.70)
        assert result.status == "decreased"
        assert "fell 5.9%" in result.explanation

    def test_small_change_is_noise(self):
        result = progress_result(current=1.71, baseline=1.70)
        assert result.status == "no_clear_change"
        assert result.value == pytest.approx(0.588, rel=1e-3)
        assert "within the ±2% measurement noise" in result.explanation

    def test_exactly_the_threshold_counts_as_a_change(self):
        result = progress_result(current=1.0 + NOISE_THRESHOLD, baseline=1.0)
        assert result.status == "increased"

    def test_inputs_let_anyone_recompute_the_value(self):
        result = progress_result(current=1.78, baseline=1.70)
        i = result.inputs
        assert result.value == pytest.approx((i["current"] - i["baseline"]) / i["baseline"] * 100)
        assert i["noise_threshold"] == NOISE_THRESHOLD

    def test_value_keeps_full_precision(self):
        assert progress_result(current=1.7811, baseline=1.7).value == pytest.approx(4.7706, rel=1e-4)


class TestValidation:
    @pytest.mark.parametrize("bad", [0, -1.2, 0.5, 3.5, float("nan"), float("inf"), "1.7", None, True])
    def test_rejects_implausible_or_non_numeric_ratios(self, bad):
        with pytest.raises(ValueError):
            ratio_result(bad)

    def test_names_which_input_was_bad(self):
        with pytest.raises(ValueError, match="baseline"):
            progress_result(current=1.7, baseline=5.0)
